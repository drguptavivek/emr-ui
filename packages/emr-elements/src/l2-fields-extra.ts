import { html, css, svg, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import type {
  AddressFieldIntent,
  AddressFieldViewModel,
  AttachmentFieldIntent,
  AttachmentFieldViewModel,
  ClinicalAssessmentStatus,
  ClinicalAssessmentStatusOption,
  DurationFieldIntent,
  DurationFieldViewModel,
  EmrAcuityCorrection,
  EmrAcuityNotation,
  EmrAddressValue,
  EmrDurationUnit,
  EmrFileSelectionItem,
  EmrImageCropResult,
  EmrLateralityCode,
  EmrOption,
  EmrPhoneChannel,
  EmrSegmentedOption,
  EmrSignaturePoint,
  EmrUploadedImageItem,
  ImageFieldIntent,
  ImageFieldViewModel,
  LateralityFieldIntent,
  LateralityFieldViewModel,
  MacroTextFieldIntent,
  MacroTextFieldViewModel,
  PairedFieldIntent,
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
  .laterality-btn:focus-visible,
  .macro-option:focus-visible,
  .sig-pad:focus-visible {
    outline: 2px solid var(--emr-focus);
    outline-offset: -2px;
  }

  .sig-pad-wrap {
    border: 1.5px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    overflow: hidden;
  }
  .sig-pad {
    display: block;
    width: 100%;
    height: auto;
    touch-action: none;
    cursor: crosshair;
  }
  .sig-pad--readonly {
    background: var(--emr-surface-soft);
    cursor: default;
  }

  .macro-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }
  .macro-popover {
    display: grid;
    gap: 4px;
    padding: 6px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    box-shadow: var(--emr-shadow);
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
  .macro-option:hover {
    background: var(--emr-primary-soft);
    border-color: var(--emr-primary-border);
  }

  .laterality-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .laterality-btn {
    min-height: 44px;
    min-width: 64px;
    padding: 0 16px;
    border: 1.5px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-semibold);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
  }
  .laterality-btn[aria-checked="true"] {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
    color: var(--emr-primary-contrast);
  }
  .laterality-btn--readonly {
    background: var(--emr-surface-soft);
    cursor: default;
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

function formatByteSize(bytes: number | undefined): string {
  if (bytes === undefined || !Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** 1. EmrScaleFieldElement (`emr-scale-field`) */
export class EmrScaleFieldElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2ExtraStyles];

  private readonly fallbackId = nextL2ExtraId('emr-scale-field');

  @property({ type: String }) controlId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) model?: ScaleFieldViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || m.definition?.contract?.linkId || this.fallbackId;
    const locked = !!m.readOnly || !!m.definition?.contract?.readOnly;

    return html`<emr-field-frame
      .controlId=${id}
      .label=${m.label}
      .labelHidden=${this.labelHidden}
      .hint=${m.hint ?? ''}
      .messages=${m.messages ?? []}
      ?required=${!!m.required}
    >
      <div class="l2-stack">
        ${m.variant === 'vas'
          ? html`<emr-vas
              .controlId=${id}
              .label=${m.label}
              .labelHidden=${true}
              .value=${m.value}
              .min=${m.min}
              .max=${m.max}
              .step=${m.step ?? 1}
              .majorInterval=${m.majorInterval ?? 10}
              .minorInterval=${m.minorInterval ?? 5}
              .orientation=${m.orientation ?? 'horizontal'}
              .anchors=${m.anchors}
              .tone=${m.tone ?? 'neutral'}
              .readOnly=${locked}
              @valueChange=${(e: CustomEvent<number | null>) => {
                e.stopPropagation();
                if (!locked) {
                  this.emitIntent<ScaleFieldIntent>({ type: 'valueChangeRequested', value: e.detail });
                }
              }}
            ></emr-vas>`
          : html`<emr-likert
              .controlId=${id}
              .label=${m.label}
              .labelHidden=${true}
              .value=${m.value}
              .min=${m.min}
              .max=${m.max}
              .anchors=${m.anchors}
              .optionTones=${m.optionTones}
              .tone=${m.tone}
              .readOnly=${locked}
              @valueChange=${(e: CustomEvent<number>) => {
                e.stopPropagation();
                if (!locked) {
                  this.emitIntent<ScaleFieldIntent>({ type: 'valueChangeRequested', value: e.detail });
                }
              }}
            ></emr-likert>`}
        <div class="l2-row">
          ${m.value !== null && !locked
            ? html`<button
                type="button"
                class="emr-btn emr-btn--ghost emr-btn--sm"
                @click=${() => {
                  if (!this.model?.readOnly) {
                    this.emitIntent<ScaleFieldIntent>({ type: 'valueChangeRequested', value: null });
                  }
                }}
              >Clear</button>`
            : nothing}
          ${renderAssessmentStatusStrip(m.status, m.statusOptions, locked, next => {
            if (!this.model?.readOnly) {
              this.emitIntent<ScaleFieldIntent>({ type: 'statusChangeRequested', status: next });
            }
          })}
        </div>
      </div>
    </emr-field-frame>`;
  }
}

const PARTIAL_DATE_PRECISION_OPTIONS: readonly EmrSegmentedOption<'year' | 'month' | 'day'>[] = [
  { value: 'year', label: 'Year' },
  { value: 'month', label: 'Year + Month' },
  { value: 'day', label: 'Full Date' },
];

/** 2. EmrPartialDateFieldElement (`emr-partial-date-field`) */
export class EmrPartialDateFieldElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2ExtraStyles];

  private readonly fallbackId = nextL2ExtraId('emr-partial-date');

  @property({ type: String }) controlId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) model?: PartialDateFieldViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const locked = !!m.readOnly;
    const precision = m.value?.precision ?? 'day';

    return html`<emr-field-frame
      .controlId=${id}
      .label=${m.label}
      .labelHidden=${this.labelHidden}
      .hint=${m.hint ?? ''}
      .messages=${m.messages ?? []}
      ?required=${!!m.required}
    >
      <div class="l2-stack">
        <div class="l2-row">
          <emr-segmented-control
            .controlId=${`${id}-precision`}
            .label=${`${m.label} precision`}
            .labelHidden=${true}
            .options=${PARTIAL_DATE_PRECISION_OPTIONS}
            .value=${precision}
            .readOnly=${locked}
            @valueChange=${(e: CustomEvent<string>) => {
              e.stopPropagation();
              if (!this.model?.readOnly) {
                this.emitIntent<PartialDateFieldIntent>({
                  type: 'precisionChangeRequested',
                  precision: e.detail as 'year' | 'month' | 'day',
                });
              }
            }}
          ></emr-segmented-control>
          <emr-date-input
            .controlId=${id}
            .label=${m.label}
            .labelHidden=${true}
            .precision=${precision}
            .value=${m.value?.value ?? null}
            .min=${m.min ?? ''}
            .max=${m.max ?? ''}
            .readOnly=${locked}
            @valueChange=${(e: CustomEvent<string | null>) => {
              e.stopPropagation();
              if (!this.model?.readOnly) {
                this.emitIntent<PartialDateFieldIntent>({
                  type: 'valueChangeRequested',
                  value: e.detail ? { value: e.detail, precision } : null,
                });
              }
            }}
          ></emr-date-input>
        </div>
        ${renderAssessmentStatusStrip(m.status, m.statusOptions, locked, next => {
          if (!this.model?.readOnly) {
            this.emitIntent<PartialDateFieldIntent>({ type: 'statusChangeRequested', status: next });
          }
        })}
      </div>
    </emr-field-frame>`;
  }
}

/** 3. EmrAttachmentFieldElement (`emr-attachment-field`) */
export class EmrAttachmentFieldElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2ExtraStyles];

  private readonly fallbackId = nextL2ExtraId('emr-attachment-field');

  @property({ type: String }) controlId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) model?: AttachmentFieldViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const locked = !!m.readOnly;
    const atCapacity = m.maxItems !== undefined && m.items.length >= m.maxItems;

    return html`<emr-field-frame
      .controlId=${id}
      .label=${m.label}
      .labelHidden=${this.labelHidden}
      .hint=${m.hint ?? ''}
      .messages=${m.messages ?? []}
      ?required=${!!m.required}
    >
      <div class="l2-stack">
        ${m.items.length > 0
          ? html`<ul class="attachment-list" aria-label=${`${m.label} attachments`}>
              ${m.items.map(item => {
                const meta = [item.contentType, formatByteSize(item.sizeBytes), item.uploadedAt]
                  .filter(Boolean)
                  .join(' · ');
                return html`<li class="attachment-item">
                  <button
                    type="button"
                    class="attachment-select-btn"
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
                          class="emr-btn emr-btn--ghost emr-btn--sm"
                          aria-label=${`Remove ${item.title}`}
                          @click=${() => {
                            if (!this.model?.readOnly) {
                              this.emitIntent<AttachmentFieldIntent>({ type: 'itemRemoveRequested', id: item.id });
                            }
                          }}
                        >${renderEmrSvgIcon('trash', 15)} Remove</button>`
                      : nothing}
                  </div>
                </li>`;
              })}
            </ul>`
          : locked && !m.status
            ? html`<span class="emr-muted">No attachments</span>`
            : nothing}

        ${!locked
          ? html`<div class="l2-row">
              <emr-file-trigger
                .controlId=${id}
                .label=${m.label}
                .labelHidden=${true}
                .accept=${m.accept ?? ''}
                .multiple=${!!m.multiple}
                .disabled=${atCapacity}
                @filesSelected=${(e: CustomEvent<readonly EmrFileSelectionItem[]>) => {
                  e.stopPropagation();
                  if (!this.model?.readOnly && !atCapacity) {
                    this.emitIntent<AttachmentFieldIntent>({ type: 'filesSelected', files: e.detail });
                  }
                }}
              ></emr-file-trigger>
              ${m.allowCamera
                ? html`
                    <button
                      type="button"
                      class="emr-btn emr-btn--secondary"
                      ?disabled=${atCapacity}
                      @click=${() => {
                        if (!this.model?.readOnly && !atCapacity) {
                          this.emitIntent<AttachmentFieldIntent>({ type: 'captureRequested', mode: 'camera' });
                        }
                      }}
                    >${renderEmrSvgIcon('camera', 16)} Camera</button>
                    <button
                      type="button"
                      class="emr-btn emr-btn--secondary"
                      ?disabled=${atCapacity}
                      @click=${() => {
                        if (!this.model?.readOnly && !atCapacity) {
                          this.emitIntent<AttachmentFieldIntent>({ type: 'captureRequested', mode: 'scanner' });
                        }
                      }}
                    >${renderEmrSvgIcon('scanner', 16)} Scanner</button>
                  `
                : nothing}
            </div>`
          : nothing}

        ${renderAssessmentStatusStrip(m.status, m.statusOptions, locked, next => {
          if (!this.model?.readOnly) {
            this.emitIntent<AttachmentFieldIntent>({ type: 'statusChangeRequested', status: next });
          }
        })}
      </div>
    </emr-field-frame>`;
  }
}

/** 4. EmrPairedFieldElement (`emr-paired-field`) */
export class EmrPairedFieldElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2ExtraStyles];

  private readonly fallbackId = nextL2ExtraId('emr-paired-field');

  @property({ type: String }) controlId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) model?: PairedFieldViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const locked = !!m.readOnly;
    const mode = m.mode ?? 'text';
    const sep = m.separator ?? '/';

    return html`<emr-field-frame
      .controlId=${id}
      .label=${m.label}
      .labelHidden=${this.labelHidden}
      .hint=${m.hint ?? ''}
      .messages=${m.messages ?? []}
      ?required=${!!m.required}
    >
      <div class="l2-stack">
        ${mode === 'decimal' || mode === 'integer'
          ? html`<div class="l2-row">
              <div class="sub-field">
                <span class="sub-label">${m.firstLabel}</span>
                <emr-number-input
                  .controlId=${`${id}-first`}
                  .label=${`${m.label}, ${m.firstLabel}`}
                  .labelHidden=${true}
                  .mode=${mode}
                  .value=${typeof m.value?.first === 'number' ? m.value.first : null}
                  .min=${m.min}
                  .max=${m.max}
                  .step=${m.step ?? (mode === 'integer' ? 1 : 0.1)}
                  .readOnly=${locked}
                  @valueChange=${(e: CustomEvent<number | null>) => {
                    e.stopPropagation();
                    if (!this.model?.readOnly) {
                      this.emitIntent<PairedFieldIntent>({ type: 'firstChangeRequested', value: e.detail });
                    }
                  }}
                ></emr-number-input>
              </div>
              <strong class="emr-muted" aria-hidden="true">${sep}</strong>
              <div class="sub-field">
                <span class="sub-label">${m.secondLabel}</span>
                <emr-number-input
                  .controlId=${`${id}-second`}
                  .label=${`${m.label}, ${m.secondLabel}`}
                  .labelHidden=${true}
                  .mode=${mode}
                  .value=${typeof m.value?.second === 'number' ? m.value.second : null}
                  .min=${m.min}
                  .max=${m.max}
                  .step=${m.step ?? (mode === 'integer' ? 1 : 0.1)}
                  .readOnly=${locked}
                  @valueChange=${(e: CustomEvent<number | null>) => {
                    e.stopPropagation();
                    if (!this.model?.readOnly) {
                      this.emitIntent<PairedFieldIntent>({ type: 'secondChangeRequested', value: e.detail });
                    }
                  }}
                ></emr-number-input>
              </div>
              ${m.unit ? html`<span class="emr-muted">${m.unit}</span>` : nothing}
            </div>`
          : html`<div class="l2-row">
              <emr-paired-input
                .controlId=${id}
                .label=${m.label}
                .labelHidden=${true}
                .firstLabel=${m.firstLabel}
                .secondLabel=${m.secondLabel}
                .firstPlaceholder=${m.firstPlaceholder ?? ''}
                .secondPlaceholder=${m.secondPlaceholder ?? ''}
                .separator=${sep}
                .firstValue=${m.value?.first == null ? '' : String(m.value.first)}
                .secondValue=${m.value?.second == null ? '' : String(m.value.second)}
                .readOnly=${locked}
                @firstValueChange=${(e: CustomEvent<string | null>) => {
                  e.stopPropagation();
                  if (!this.model?.readOnly) {
                    this.emitIntent<PairedFieldIntent>({ type: 'firstChangeRequested', value: e.detail });
                  }
                }}
                @secondValueChange=${(e: CustomEvent<string | null>) => {
                  e.stopPropagation();
                  if (!this.model?.readOnly) {
                    this.emitIntent<PairedFieldIntent>({ type: 'secondChangeRequested', value: e.detail });
                  }
                }}
              ></emr-paired-input>
              ${m.unit ? html`<span class="emr-muted">${m.unit}</span>` : nothing}
            </div>`}
        ${renderAssessmentStatusStrip(m.status, m.statusOptions, locked, next => {
          if (!this.model?.readOnly) {
            this.emitIntent<PairedFieldIntent>({ type: 'statusChangeRequested', status: next });
          }
        })}
      </div>
    </emr-field-frame>`;
  }
}

/** 5. EmrDurationInputElement (`emr-duration-input`) */
export class EmrDurationInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2ExtraStyles];

  private readonly fallbackId = nextL2ExtraId('emr-duration-input');

  @property({ type: String }) controlId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) model?: DurationFieldViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const locked = !!m.readOnly;
    const segOpts: EmrSegmentedOption<EmrDurationUnit>[] = m.unitOptions.map(u => ({
      value: u.value,
      label: u.label,
    }));

    return html`<emr-field-frame
      .controlId=${id}
      .label=${m.label}
      .labelHidden=${this.labelHidden}
      .hint=${m.hint ?? ''}
      .messages=${m.messages ?? []}
      ?required=${!!m.required}
    >
      <div class="l2-stack">
        <div class="l2-row">
          <emr-number-input
            .controlId=${id}
            .label=${`${m.label} amount`}
            .labelHidden=${true}
            .value=${m.value?.amount ?? null}
            .min=${m.min ?? 0}
            .max=${m.max}
            .step=${m.step ?? 1}
            .readOnly=${locked}
            @valueChange=${(e: CustomEvent<number | null>) => {
              e.stopPropagation();
              if (!this.model?.readOnly) {
                this.emitIntent<DurationFieldIntent>({ type: 'amountChangeRequested', amount: e.detail });
              }
            }}
          ></emr-number-input>
          <emr-segmented-control
            .controlId=${`${id}-unit`}
            .label=${`${m.label} unit`}
            .labelHidden=${true}
            .options=${segOpts}
            .value=${m.value?.unit ?? null}
            .readOnly=${locked}
            @valueChange=${(e: CustomEvent<string>) => {
              e.stopPropagation();
              if (!this.model?.readOnly) {
                this.emitIntent<DurationFieldIntent>({
                  type: 'unitChangeRequested',
                  unit: e.detail as EmrDurationUnit,
                });
              }
            }}
          ></emr-segmented-control>
        </div>
        ${renderAssessmentStatusStrip(m.status, m.statusOptions, locked, next => {
          if (!this.model?.readOnly) {
            this.emitIntent<DurationFieldIntent>({ type: 'statusChangeRequested', status: next });
          }
        })}
      </div>
    </emr-field-frame>`;
  }
}

/** 6. EmrRangeFieldElement (`emr-range-field`) */
export class EmrRangeFieldElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2ExtraStyles];

  private readonly fallbackId = nextL2ExtraId('emr-range-field');

  @property({ type: String }) controlId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) model?: RangeFieldViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const locked = !!m.readOnly;

    return html`<emr-field-frame
      .controlId=${id}
      .label=${m.label}
      .labelHidden=${this.labelHidden}
      .hint=${m.hint ?? ''}
      .messages=${m.messages ?? []}
      ?required=${!!m.required}
    >
      ${m.kind === 'date'
        ? html`<div class="l2-row">
            <div class="sub-field">
              <span class="sub-label">From</span>
              <emr-date-input
                .controlId=${`${id}-low`}
                .label=${`${m.label} start`}
                .labelHidden=${true}
                .value=${typeof m.value?.low === 'string' ? m.value.low : null}
                .min=${typeof m.min === 'string' ? m.min : ''}
                .max=${typeof m.max === 'string' ? m.max : ''}
                .placeholder=${m.lowPlaceholder ?? ''}
                .readOnly=${locked}
                @valueChange=${(e: CustomEvent<string | null>) => {
                  e.stopPropagation();
                  if (!this.model?.readOnly) {
                    this.emitIntent<RangeFieldIntent>({ type: 'lowChangeRequested', low: e.detail });
                  }
                }}
              ></emr-date-input>
            </div>
            <span class="emr-muted" aria-hidden="true">–</span>
            <div class="sub-field">
              <span class="sub-label">To</span>
              <emr-date-input
                .controlId=${`${id}-high`}
                .label=${`${m.label} end`}
                .labelHidden=${true}
                .value=${typeof m.value?.high === 'string' ? m.value.high : null}
                .min=${typeof m.min === 'string' ? m.min : ''}
                .max=${typeof m.max === 'string' ? m.max : ''}
                .placeholder=${m.highPlaceholder ?? ''}
                .readOnly=${locked}
                @valueChange=${(e: CustomEvent<string | null>) => {
                  e.stopPropagation();
                  if (!this.model?.readOnly) {
                    this.emitIntent<RangeFieldIntent>({ type: 'highChangeRequested', high: e.detail });
                  }
                }}
              ></emr-date-input>
            </div>
          </div>`
        : html`<div class="l2-row">
            <div class="sub-field">
              <span class="sub-label">${m.lowPlaceholder || 'Low'}</span>
              <emr-number-input
                .controlId=${`${id}-low`}
                .label=${`${m.label} low`}
                .labelHidden=${true}
                .value=${typeof m.value?.low === 'number' ? m.value.low : null}
                .min=${typeof m.min === 'number' ? m.min : undefined}
                .max=${typeof m.max === 'number' ? m.max : undefined}
                .step=${m.step ?? 1}
                .readOnly=${locked}
                @valueChange=${(e: CustomEvent<number | null>) => {
                  e.stopPropagation();
                  if (!this.model?.readOnly) {
                    this.emitIntent<RangeFieldIntent>({ type: 'lowChangeRequested', low: e.detail });
                  }
                }}
              ></emr-number-input>
            </div>
            <span class="emr-muted" aria-hidden="true">–</span>
            <div class="sub-field">
              <span class="sub-label">${m.highPlaceholder || 'High'}</span>
              <emr-number-input
                .controlId=${`${id}-high`}
                .label=${`${m.label} high`}
                .labelHidden=${true}
                .value=${typeof m.value?.high === 'number' ? m.value.high : null}
                .min=${typeof m.min === 'number' ? m.min : undefined}
                .max=${typeof m.max === 'number' ? m.max : undefined}
                .step=${m.step ?? 1}
                .readOnly=${locked}
                @valueChange=${(e: CustomEvent<number | null>) => {
                  e.stopPropagation();
                  if (!this.model?.readOnly) {
                    this.emitIntent<RangeFieldIntent>({ type: 'highChangeRequested', high: e.detail });
                  }
                }}
              ></emr-number-input>
            </div>
            ${m.unit ? html`<span class="emr-muted">${m.unit}</span>` : nothing}
          </div>`}
    </emr-field-frame>`;
  }
}

/** 7. EmrSignatureCaptureFieldElement (`emr-signature-capture-field`) */
export class EmrSignatureCaptureFieldElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2ExtraStyles];

  private readonly fallbackId = nextL2ExtraId('emr-signature-capture');

  @property({ type: String }) controlId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) model?: SignatureCaptureViewModel;

  @state() private activePoints: EmrSignaturePoint[] = [];
  private drawing = false;

  private toPadPoint(event: PointerEvent, padEl: SVGSVGElement, w: number, h: number): EmrSignaturePoint {
    const rect = padEl.getBoundingClientRect();
    const scaleX = rect.width > 0 ? w / rect.width : 1;
    const scaleY = rect.height > 0 ? h / rect.height : 1;
    const x = Number(Math.min(w, Math.max(0, (event.clientX - rect.left) * scaleX)).toFixed(2));
    const y = Number(Math.min(h, Math.max(0, (event.clientY - rect.top) * scaleY)).toFixed(2));
    return { x, y };
  }

  private finishStroke(event: PointerEvent, padEl: SVGSVGElement): void {
    if (!this.drawing) return;
    this.drawing = false;
    if (padEl.hasPointerCapture?.(event.pointerId)) {
      padEl.releasePointerCapture(event.pointerId);
    }
    const completed = this.activePoints;
    this.activePoints = [];
    if (!this.model?.readOnly && completed.length > 0) {
      this.emitIntent<SignatureCaptureIntent>({
        type: 'strokeAdded',
        stroke: { points: completed },
      });
    }
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const locked = !!m.readOnly;
    const w = m.width ?? 420;
    const h = m.height ?? 140;
    const signerMeta = [m.signatoryName, m.signatoryRole, m.signedAt].filter(Boolean).join(' · ');

    const toAttr = (pts: readonly EmrSignaturePoint[]) => pts.map(p => `${p.x},${p.y}`).join(' ');

    return html`<emr-field-frame
      .controlId=${id}
      .label=${m.label}
      .labelHidden=${this.labelHidden}
      .hint=${m.hint ?? ''}
      .messages=${m.messages ?? []}
      ?required=${!!m.required}
    >
      <div class="l2-stack">
        ${signerMeta ? html`<span class="emr-muted">${signerMeta}</span>` : nothing}
        <div class="sig-pad-wrap">
          <svg
            id=${id}
            part="pad"
            role="img"
            aria-label=${`${m.label} signature pad`}
            class=${`sig-pad${locked ? ' sig-pad--readonly' : ''}`}
            viewBox=${`0 0 ${w} ${h}`}
            width=${String(w)}
            height=${String(h)}
            @pointerdown=${(e: PointerEvent) => {
              if (locked) return;
              const pad = e.currentTarget as SVGSVGElement;
              this.drawing = true;
              pad.setPointerCapture?.(e.pointerId);
              e.preventDefault();
              this.activePoints = [this.toPadPoint(e, pad, w, h)];
            }}
            @pointermove=${(e: PointerEvent) => {
              if (locked || !this.drawing) return;
              const pad = e.currentTarget as SVGSVGElement;
              e.preventDefault();
              this.activePoints = [...this.activePoints, this.toPadPoint(e, pad, w, h)];
            }}
            @pointerup=${(e: PointerEvent) => this.finishStroke(e, e.currentTarget as SVGSVGElement)}
            @pointercancel=${(e: PointerEvent) => {
              this.drawing = false;
              this.activePoints = [];
              const pad = e.currentTarget as SVGSVGElement;
              if (pad.hasPointerCapture?.(e.pointerId)) {
                pad.releasePointerCapture(e.pointerId);
              }
            }}
          >
            <line
              x1="16"
              y1=${String(Math.round(h * 0.78))}
              x2=${String(w - 16)}
              y2=${String(Math.round(h * 0.78))}
              stroke="var(--emr-border)"
              stroke-dasharray="4 4"
            />
            ${m.strokes.map(
              stroke =>
                svg`<polyline fill="none" stroke="var(--emr-text)" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" points=${toAttr(stroke.points)} />`,
            )}
            ${this.activePoints.length > 0
              ? svg`<polyline fill="none" stroke="var(--emr-primary)" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" points=${toAttr(this.activePoints)} />`
              : nothing}
          </svg>
        </div>
        ${!locked
          ? html`<div class="l2-row">
              <button
                type="button"
                class="emr-btn emr-btn--outline emr-btn--sm"
                ?disabled=${m.strokes.length === 0}
                @click=${() => {
                  if (!this.model?.readOnly) {
                    this.emitIntent<SignatureCaptureIntent>({ type: 'clearRequested' });
                  }
                }}
              >Clear signature</button>
            </div>`
          : nothing}
      </div>
    </emr-field-frame>`;
  }
}

/** 8. EmrPhoneInputElement (`emr-phone-input`) */
export class EmrPhoneInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2ExtraStyles];

  private readonly fallbackId = nextL2ExtraId('emr-phone-input');

  @property({ type: String }) controlId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) model?: PhoneFieldViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const locked = !!m.readOnly;
    const countryOpts: EmrOption[] = m.countryOptions.map(c => ({ value: c.code, label: c.label }));
    const activeChannels = new Set(m.channels ?? []);

    return html`<emr-field-frame
      .controlId=${id}
      .label=${m.label}
      .labelHidden=${this.labelHidden}
      .hint=${m.hint ?? ''}
      .messages=${m.messages ?? []}
      ?required=${!!m.required}
    >
      <div class="l2-stack">
        <div class="l2-row">
          <div style="min-width: 120px;">
            <emr-select
              .controlId=${`${id}-country`}
              .label=${`${m.label} country code`}
              .labelHidden=${true}
              .options=${countryOpts}
              .value=${m.countryCode}
              .readOnly=${locked}
              @valueChange=${(e: CustomEvent<string | null>) => {
                e.stopPropagation();
                if (!this.model?.readOnly && e.detail) {
                  this.emitIntent<PhoneFieldIntent>({
                    type: 'countryCodeChangeRequested',
                    countryCode: e.detail,
                  });
                }
              }}
            ></emr-select>
          </div>
          <input
            id=${id}
            class="emr-control"
            style="flex: 1; min-width: 160px;"
            type="tel"
            inputmode="tel"
            aria-label=${`${m.label} number`}
            .value=${locked ? live(m.nationalNumber) : m.nationalNumber}
            ?readonly=${locked}
            @blur=${(e: Event) => {
              (e.target as HTMLInputElement).value = this.model?.nationalNumber ?? '';
            }}
            @input=${(e: Event) => {
              if (this.model?.readOnly) {
                (e.target as HTMLInputElement).value = this.model.nationalNumber;
                return;
              }
              this.emitIntent<PhoneFieldIntent>({
                type: 'numberChangeRequested',
                nationalNumber: (e.target as HTMLInputElement).value,
              });
            }}
          />
          ${m.extension !== undefined
            ? html`<input
                id=${`${id}-ext`}
                class="emr-control"
                style="width: 108px;"
                type="text"
                placeholder="Ext."
                aria-label=${`${m.label} extension`}
                .value=${locked ? live(m.extension) : m.extension}
                ?readonly=${locked}
                @blur=${(e: Event) => {
                  (e.target as HTMLInputElement).value = this.model?.extension ?? '';
                }}
                @input=${(e: Event) => {
                  if (this.model?.readOnly) {
                    (e.target as HTMLInputElement).value = this.model.extension ?? '';
                    return;
                  }
                  this.emitIntent<PhoneFieldIntent>({
                    type: 'extensionChangeRequested',
                    extension: (e.target as HTMLInputElement).value,
                  });
                }}
              />`
            : nothing}
          ${m.verifiedBadge ? html`<emr-badge .badge=${m.verifiedBadge}></emr-badge>` : nothing}
        </div>

        ${m.availableChannels && m.availableChannels.length > 0
          ? html`<div class="l2-row" role="group" aria-label=${`${m.label} messaging channels`}>
              ${m.availableChannels.map(ch => {
                const selected = activeChannels.has(ch.id);
                return html`<button
                  type="button"
                  role="checkbox"
                  class="emr-btn emr-btn--secondary emr-btn--sm"
                  aria-checked=${String(selected)}
                  aria-readonly=${locked ? 'true' : nothing}
                  @click=${() => {
                    if (!this.model?.readOnly) {
                      this.emitIntent<PhoneFieldIntent>({
                        type: 'channelToggleRequested',
                        channel: ch.id as EmrPhoneChannel,
                      });
                    }
                  }}
                >${ch.label}</button>`;
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
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) model?: AddressFieldViewModel;

  private emitPart(part: keyof EmrAddressValue, value: string): void {
    if (this.model?.readOnly) return;
    this.emitIntent<AddressFieldIntent>({ type: 'fieldChangeRequested', part, value });
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const locked = !!m.readOnly;
    const addr = m.value;

    return html`<emr-field-frame
      .controlId=${id}
      .label=${m.label}
      .labelHidden=${this.labelHidden}
      .hint=${m.hint ?? ''}
      .messages=${m.messages ?? []}
      ?required=${!!m.required}
    >
      <div class="l2-stack">
        ${m.useOptions && m.useOptions.length > 0
          ? html`<emr-segmented-control
              .controlId=${`${id}-use`}
              .label=${`${m.label} use`}
              .labelHidden=${true}
              .options=${m.useOptions}
              .value=${m.use ?? null}
              .readOnly=${locked}
              @valueChange=${(e: CustomEvent<string>) => {
                e.stopPropagation();
                if (!this.model?.readOnly) {
                  this.emitIntent<AddressFieldIntent>({
                    type: 'useChangeRequested',
                    use: e.detail as 'home' | 'work' | 'temp' | 'billing',
                  });
                }
              }}
            ></emr-segmented-control>`
          : nothing}

        <div class="sub-field">
          <label class="sub-label" for=${`${id}-line1`}>Address line 1</label>
          <emr-text-input
            .controlId=${`${id}-line1`}
            .label=${`${m.label} line 1`}
            .labelHidden=${true}
            .value=${addr.line1}
            .readOnly=${locked}
            @valueChange=${(e: CustomEvent<string | null>) => {
              e.stopPropagation();
              this.emitPart('line1', e.detail ?? '');
            }}
          ></emr-text-input>
        </div>

        <div class="sub-field">
          <label class="sub-label" for=${`${id}-line2`}>Address line 2</label>
          <emr-text-input
            .controlId=${`${id}-line2`}
            .label=${`${m.label} line 2`}
            .labelHidden=${true}
            .value=${addr.line2 ?? ''}
            .readOnly=${locked}
            @valueChange=${(e: CustomEvent<string | null>) => {
              e.stopPropagation();
              this.emitPart('line2', e.detail ?? '');
            }}
          ></emr-text-input>
        </div>

        <div class="l2-grid-2">
          <div class="sub-field">
            <label class="sub-label" for=${`${id}-city`}>City / Town</label>
            <emr-text-input
              .controlId=${`${id}-city`}
              .label=${`${m.label} city`}
              .labelHidden=${true}
              .value=${addr.city}
              .readOnly=${locked}
              @valueChange=${(e: CustomEvent<string | null>) => {
                e.stopPropagation();
                this.emitPart('city', e.detail ?? '');
              }}
            ></emr-text-input>
          </div>

          ${m.showDistrict || addr.district
            ? html`<div class="sub-field">
                <label class="sub-label" for=${`${id}-district`}>District</label>
                <emr-text-input
                  .controlId=${`${id}-district`}
                  .label=${`${m.label} district`}
                  .labelHidden=${true}
                  .value=${addr.district ?? ''}
                  .readOnly=${locked}
                  @valueChange=${(e: CustomEvent<string | null>) => {
                    e.stopPropagation();
                    this.emitPart('district', e.detail ?? '');
                  }}
                ></emr-text-input>
              </div>`
            : nothing}

          <div class="sub-field">
            <label class="sub-label" for=${`${id}-state`}>State / Province</label>
            ${m.stateOptions && m.stateOptions.length > 0
              ? html`<emr-select
                  .controlId=${`${id}-state`}
                  .label=${`${m.label} state`}
                  .labelHidden=${true}
                  .options=${m.stateOptions}
                  .value=${addr.state || null}
                  .readOnly=${locked}
                  @valueChange=${(e: CustomEvent<string | null>) => {
                    e.stopPropagation();
                    this.emitPart('state', e.detail ?? '');
                  }}
                ></emr-select>`
              : html`<emr-text-input
                  .controlId=${`${id}-state`}
                  .label=${`${m.label} state`}
                  .labelHidden=${true}
                  .value=${addr.state}
                  .readOnly=${locked}
                  @valueChange=${(e: CustomEvent<string | null>) => {
                    e.stopPropagation();
                    this.emitPart('state', e.detail ?? '');
                  }}
                ></emr-text-input>`}
          </div>

          <div class="sub-field">
            <label class="sub-label" for=${`${id}-postalCode`}>Postal / PIN code</label>
            <emr-text-input
              .controlId=${`${id}-postalCode`}
              .label=${`${m.label} postal code`}
              .labelHidden=${true}
              .value=${addr.postalCode}
              .readOnly=${locked}
              @valueChange=${(e: CustomEvent<string | null>) => {
                e.stopPropagation();
                this.emitPart('postalCode', e.detail ?? '');
              }}
            ></emr-text-input>
          </div>

          <div class="sub-field">
            <label class="sub-label" for=${`${id}-country`}>Country</label>
            ${m.countryOptions && m.countryOptions.length > 0
              ? html`<emr-select
                  .controlId=${`${id}-country`}
                  .label=${`${m.label} country`}
                  .labelHidden=${true}
                  .options=${m.countryOptions}
                  .value=${addr.country || null}
                  .readOnly=${locked}
                  @valueChange=${(e: CustomEvent<string | null>) => {
                    e.stopPropagation();
                    this.emitPart('country', e.detail ?? '');
                  }}
                ></emr-select>`
              : html`<emr-text-input
                  .controlId=${`${id}-country`}
                  .label=${`${m.label} country`}
                  .labelHidden=${true}
                  .value=${addr.country}
                  .readOnly=${locked}
                  @valueChange=${(e: CustomEvent<string | null>) => {
                    e.stopPropagation();
                    this.emitPart('country', e.detail ?? '');
                  }}
                ></emr-text-input>`}
          </div>
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
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) model?: MacroTextFieldViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const locked = !!m.readOnly;

    return html`<emr-field-frame
      .controlId=${id}
      .label=${m.label}
      .labelHidden=${this.labelHidden}
      .hint=${m.hint ?? ''}
      .messages=${m.messages ?? []}
      ?required=${!!m.required}
    >
      <div class="l2-stack">
        <textarea
          id=${id}
          class="emr-control"
          rows=${m.rows ?? 4}
          placeholder=${m.placeholder ?? ''}
          aria-label=${m.label}
          .value=${locked ? live(m.value) : m.value}
          ?readonly=${locked}
          @blur=${(e: Event) => {
            (e.target as HTMLTextAreaElement).value = this.model?.value ?? '';
          }}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === 'Escape' && this.model?.suggestionsOpen && !this.model.readOnly) {
              e.preventDefault();
              this.emitIntent<MacroTextFieldIntent>({ type: 'macroDismissRequested' });
            }
          }}
          @input=${(e: Event) => {
            const area = e.target as HTMLTextAreaElement;
            if (this.model?.readOnly) {
              area.value = this.model.value;
              return;
            }
            const nextVal = area.value;
            this.emitIntent<MacroTextFieldIntent>({ type: 'valueChangeRequested', value: nextVal });
            const caret = area.selectionStart ?? nextVal.length;
            const uptoCaret = nextVal.slice(0, caret);
            const triggerMatch = /(?:^|\s)([./][A-Za-z0-9_-]*)$/.exec(uptoCaret);
            if (triggerMatch?.[1]) {
              this.emitIntent<MacroTextFieldIntent>({
                type: 'macroQueryRequested',
                trigger: triggerMatch[1],
              });
            }
          }}
        ></textarea>

        ${!locked
          ? html`<div class="macro-toolbar">
              <span class="emr-muted">Type . or / to expand macros</span>
              <button
                type="button"
                class="emr-btn emr-btn--secondary emr-btn--sm"
                aria-pressed=${String(!!m.dictating)}
                @click=${() => {
                  if (!this.model?.readOnly) {
                    this.emitIntent<MacroTextFieldIntent>({ type: 'dictationToggleRequested' });
                  }
                }}
              >${renderEmrSvgIcon('mic', 15)} ${m.dictating ? 'Stop dictation' : 'Dictate'}</button>
            </div>`
          : nothing}

        ${m.suggestionsOpen && m.suggestions.length > 0 && !locked
          ? html`<div class="macro-popover" role="listbox" aria-label="Macro suggestions">
              ${m.suggestions.map(
                s => html`<button
                  type="button"
                  role="option"
                  class="macro-option"
                  aria-selected="false"
                  @click=${() => {
                    if (!this.model?.readOnly) {
                      this.emitIntent<MacroTextFieldIntent>({ type: 'macroSelected', trigger: s.trigger });
                    }
                  }}
                >
                  <strong>${s.trigger} · ${s.label}</strong>
                  <span class="emr-muted">${s.expansionPreview}</span>
                </button>`,
              )}
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

  @property({ type: String }) controlId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) model?: LateralityFieldViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const locked = !!m.readOnly;

    return html`<emr-field-frame
      .controlId=${id}
      .label=${m.label}
      .labelHidden=${this.labelHidden}
      .hint=${m.hint ?? ''}
      .messages=${m.messages ?? []}
      ?required=${!!m.required}
    >
      <div class="l2-stack">
        <div
          id=${id}
          role="radiogroup"
          aria-label=${m.label}
          aria-readonly=${locked ? 'true' : nothing}
          class="laterality-group"
        >
          ${m.options.map(opt => {
            const selected = m.value === opt.code;
            const cls = `laterality-btn${locked ? ' laterality-btn--readonly' : ''}`;
            return html`<button
              type="button"
              role="radio"
              class=${cls}
              aria-checked=${String(selected)}
              aria-readonly=${locked ? 'true' : nothing}
              @click=${() => {
                if (this.model?.readOnly) return;
                const nextCode: EmrLateralityCode | null =
                  selected && !m.required ? null : opt.code;
                this.emitIntent<LateralityFieldIntent>({
                  type: 'lateralitySelected',
                  code: nextCode,
                });
              }}
            >
              ${opt.shortLabel ? html`<span class="emr-badge">${opt.shortLabel}</span>` : nothing}
              <span>${opt.label}</span>
            </button>`;
          })}
        </div>

        ${m.requiresConfirmation
          ? html`<emr-checkbox
              .controlId=${`${id}-confirm`}
              .label=${m.confirmationLabel || 'Surgical site & laterality confirmed'}
              .checked=${!!m.confirmed}
              .readOnly=${locked}
              @checkedChange=${(e: CustomEvent<boolean>) => {
                e.stopPropagation();
                if (!this.model?.readOnly) {
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

  @property({ type: String }) controlId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) model?: VisualAcuityFieldViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const locked = !!m.readOnly;

    return html`<emr-field-frame
      .controlId=${id}
      .label=${m.label}
      .labelHidden=${this.labelHidden}
      .hint=${m.hint ?? ''}
      .messages=${m.messages ?? []}
      ?required=${!!m.required}
    >
      <div class="l2-stack">
        ${m.eye || m.derivedDisplay
          ? html`<div class="l2-row">
              ${m.eye ? html`<span class="emr-badge emr-badge--info">${m.eye}</span>` : nothing}
              ${m.derivedDisplay ? html`<span class="emr-badge">${m.derivedDisplay}</span>` : nothing}
            </div>`
          : nothing}

        <div class="l2-row">
          <emr-segmented-control
            .controlId=${`${id}-notation`}
            .label=${`${m.label} notation`}
            .labelHidden=${true}
            .options=${m.notationOptions}
            .value=${m.notation}
            .readOnly=${locked}
            @valueChange=${(e: CustomEvent<string>) => {
              e.stopPropagation();
              if (!this.model?.readOnly) {
                this.emitIntent<VisualAcuityFieldIntent>({
                  type: 'notationChangeRequested',
                  notation: e.detail as EmrAcuityNotation,
                });
              }
            }}
          ></emr-segmented-control>

          <emr-segmented-control
            .controlId=${`${id}-correction`}
            .label=${`${m.label} correction`}
            .labelHidden=${true}
            .options=${m.correctionOptions}
            .value=${m.correction}
            .readOnly=${locked}
            @valueChange=${(e: CustomEvent<string>) => {
              e.stopPropagation();
              if (!this.model?.readOnly) {
                this.emitIntent<VisualAcuityFieldIntent>({
                  type: 'correctionChangeRequested',
                  correction: e.detail as EmrAcuityCorrection,
                });
              }
            }}
          ></emr-segmented-control>
        </div>

        <div class="l2-grid-2">
          <div class="sub-field">
            <span class="sub-label">Acuity</span>
            <emr-select
              .controlId=${id}
              .label=${`${m.label} acuity`}
              .labelHidden=${true}
              .options=${m.valueOptions}
              .value=${m.value}
              .allowClear=${true}
              .readOnly=${locked}
              @valueChange=${(e: CustomEvent<string | null>) => {
                e.stopPropagation();
                if (!this.model?.readOnly) {
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
                <span class="sub-label">Pinhole (PH)</span>
                <emr-select
                  .controlId=${`${id}-pinhole`}
                  .label=${`${m.label} pinhole`}
                  .labelHidden=${true}
                  .options=${m.valueOptions}
                  .value=${m.pinholeValue ?? null}
                  .allowClear=${true}
                  .readOnly=${locked}
                  @valueChange=${(e: CustomEvent<string | null>) => {
                    e.stopPropagation();
                    if (!this.model?.readOnly) {
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

        ${renderAssessmentStatusStrip(m.status, m.statusOptions, locked, next => {
          if (!this.model?.readOnly) {
            this.emitIntent<VisualAcuityFieldIntent>({ type: 'statusChangeRequested', status: next });
          }
        })}
      </div>
    </emr-field-frame>`;
  }
}

/** 13. EmrRefractionFieldElement (`emr-refraction-field`) */
export class EmrRefractionFieldElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2ExtraStyles];

  private readonly fallbackId = nextL2ExtraId('emr-refraction-field');

  @property({ type: String }) controlId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) model?: RefractionFieldViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const locked = !!m.readOnly;

    return html`<emr-field-frame
      .controlId=${id}
      .label=${m.label}
      .labelHidden=${this.labelHidden}
      .hint=${m.hint ?? ''}
      .messages=${m.messages ?? []}
      ?required=${!!m.required}
    >
      <div class="l2-stack">
        ${m.eye || m.formattedSummary
          ? html`<div class="l2-row">
              ${m.eye ? html`<span class="emr-badge emr-badge--info">${m.eye}</span>` : nothing}
              ${m.formattedSummary ? html`<span class="emr-badge">${m.formattedSummary}</span>` : nothing}
            </div>`
          : nothing}

        <div class="l2-grid-4">
          <div class="sub-field">
            <span class="sub-label">Sphere (SPH)</span>
            <emr-number-input
              .controlId=${`${id}-sphere`}
              .label=${`${m.label} sphere`}
              .labelHidden=${true}
              .value=${m.value.sphere}
              .step=${m.sphereStep ?? 0.25}
              .unit=${'D'}
              .readOnly=${locked}
              @valueChange=${(e: CustomEvent<number | null>) => {
                e.stopPropagation();
                if (!this.model?.readOnly) {
                  this.emitIntent<RefractionFieldIntent>({
                    type: 'sphereChangeRequested',
                    sphere: e.detail,
                  });
                }
              }}
            ></emr-number-input>
          </div>

          <div class="sub-field">
            <span class="sub-label">Cylinder (CYL)</span>
            <emr-number-input
              .controlId=${`${id}-cylinder`}
              .label=${`${m.label} cylinder`}
              .labelHidden=${true}
              .value=${m.value.cylinder}
              .step=${m.cylinderStep ?? 0.25}
              .unit=${'D'}
              .readOnly=${locked}
              @valueChange=${(e: CustomEvent<number | null>) => {
                e.stopPropagation();
                if (!this.model?.readOnly) {
                  this.emitIntent<RefractionFieldIntent>({
                    type: 'cylinderChangeRequested',
                    cylinder: e.detail,
                  });
                }
              }}
            ></emr-number-input>
          </div>

          <div class="sub-field">
            <span class="sub-label">Axis</span>
            <emr-number-input
              .controlId=${`${id}-axis`}
              .label=${`${m.label} axis`}
              .labelHidden=${true}
              .mode=${'integer'}
              .value=${m.value.axis}
              .min=${0}
              .max=${180}
              .step=${1}
              .unit=${'°'}
              .readOnly=${locked}
              @valueChange=${(e: CustomEvent<number | null>) => {
                e.stopPropagation();
                if (!this.model?.readOnly) {
                  this.emitIntent<RefractionFieldIntent>({
                    type: 'axisChangeRequested',
                    axis: e.detail,
                  });
                }
              }}
            ></emr-number-input>
          </div>

          ${m.showNearAdd
            ? html`<div class="sub-field">
                <span class="sub-label">Near Add</span>
                <emr-number-input
                  .controlId=${`${id}-nearAdd`}
                  .label=${`${m.label} near add`}
                  .labelHidden=${true}
                  .value=${m.value.nearAdd ?? null}
                  .min=${0}
                  .step=${0.25}
                  .unit=${'D'}
                  .readOnly=${locked}
                  @valueChange=${(e: CustomEvent<number | null>) => {
                    e.stopPropagation();
                    if (!this.model?.readOnly) {
                      this.emitIntent<RefractionFieldIntent>({
                        type: 'nearAddChangeRequested',
                        nearAdd: e.detail,
                      });
                    }
                  }}
                ></emr-number-input>
              </div>`
            : nothing}
        </div>

        ${renderAssessmentStatusStrip(m.status, m.statusOptions, locked, next => {
          if (!this.model?.readOnly) {
            this.emitIntent<RefractionFieldIntent>({ type: 'statusChangeRequested', status: next });
          }
        })}
      </div>
    </emr-field-frame>`;
  }
}

/** 14. EmrImageFieldElement (`emr-image-field`) */
export class EmrImageFieldElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l2ExtraStyles];

  private readonly fallbackId = nextL2ExtraId('emr-image-field');

  @property({ type: String }) controlId = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) model?: ImageFieldViewModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const id = this.controlId || this.fallbackId;
    const locked = !!m.readOnly;

    return html`<emr-field-frame
      .controlId=${id}
      .label=${m.label}
      .labelHidden=${this.labelHidden}
      .hint=${m.hint ?? ''}
      .messages=${m.messages ?? []}
      ?required=${!!m.required}
    >
      <div class="l2-stack">
        <emr-image-upload
          .controlId=${id}
          .label=${m.label}
          .labelHidden=${true}
          .items=${m.items ?? []}
          .multiple=${m.multiple ?? true}
          .maxFiles=${m.maxFiles}
          .maxSizeBytes=${m.maxSizeBytes}
          .allowCamera=${!!m.allowCamera}
          .aspectPresets=${m.aspectPresets ?? []}
          .readOnly=${locked}
          @filesSelected=${(e: CustomEvent<readonly EmrFileSelectionItem[]>) => {
            e.stopPropagation();
            if (!locked) {
              this.emitIntent<ImageFieldIntent>({ type: 'filesSelected', files: e.detail });
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
              this.emitIntent<ImageFieldIntent>({ type: 'imageCropped', id: e.detail.id, result: e.detail.result });
            }
          }}
          @captionChange=${(e: CustomEvent<{ id: string; caption: string }>) => {
            e.stopPropagation();
            if (!locked) {
              this.emitIntent<ImageFieldIntent>({ type: 'captionChangeRequested', id: e.detail.id, caption: e.detail.caption });
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
        ${renderAssessmentStatusStrip(m.status, m.statusOptions, locked, next => {
          if (!locked) {
            this.emitIntent<ImageFieldIntent>({ type: 'statusChangeRequested', status: next });
          }
        })}
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
