import { html, css, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import {
  computeSelectAllState,
  toggleCheckboxGroupValue,
  toggleSelectAllValues,
  type EmrFileSelectionItem,
  type EmrOption,
  type EmrSegmentedOption,
  type EmrTone,
} from '@drguptavivek/emr-controller';
import { EmrLitElement, defineEmrElement, emrShadowStyles } from './foundations.js';
import { renderEmrSvgIcon, type EmrLitIconName } from './icons.js';

let l1ExtraIdSeq = 0;
const nextL1ExtraId = (prefix: string): string => `${prefix}-${++l1ExtraIdSeq}`;

const l1ExtraStyles = css`
  .icon-btn {
    width: var(--emr-control-height);
    min-width: 44px;
    min-height: 44px;
    padding: 0;
  }
  .icon-btn.emr-btn--sm {
    width: 44px;
    height: 44px;
  }
  .icon-btn.emr-btn--lg {
    width: 48px;
    height: 48px;
  }

  .segmented-track {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 4px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface-soft);
    max-width: 100%;
  }
  .segmented-item {
    min-height: 44px;
    min-width: 44px;
    padding: 0 14px;
    border: 1px solid transparent;
    border-radius: var(--emr-radius-sm);
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-medium);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
  }
  .segmented-item:hover:not(:disabled) {
    background: var(--emr-surface);
  }
  .segmented-item[aria-checked="true"] {
    background: var(--emr-surface);
    border-color: var(--emr-primary-border);
    color: var(--emr-primary-contrast);
    font-weight: var(--emr-weight-bold);
  }
  .segmented-item:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .segmented-item:focus-visible,
  .input-affix-btn:focus-visible,
  .stepper-action-btn:focus-visible,
  .checkbox-row-btn:focus-visible,
  .page-btn:focus-visible,
  .drop-zone:focus-visible {
    outline: 2px solid var(--emr-focus);
    outline-offset: -2px;
  }

  .input-shell {
    display: flex;
    align-items: stretch;
    min-height: var(--emr-control-height);
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    overflow: hidden;
  }
  .input-shell--invalid {
    border-color: var(--emr-danger);
  }
  .input-shell--readonly {
    background: var(--emr-surface-soft);
  }
  .input-shell:focus-within {
    outline: 2px solid var(--emr-focus);
    outline-offset: -2px;
  }
  .input-leading {
    width: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--emr-text-muted);
    flex-shrink: 0;
  }
  .input-bare {
    flex: 1;
    min-width: 0;
    min-height: 42px;
    padding: 0 10px;
    border: 0;
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-md);
    outline: none;
  }
  .input-affix-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 0 10px;
    border: 0;
    border-left: 1px solid var(--emr-border);
    background: var(--emr-surface-soft);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-semibold);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    flex-shrink: 0;
  }
  .input-affix-btn:hover:not(:disabled) {
    background: var(--emr-primary-hover);
  }
  .input-affix-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .stepper-box {
    display: inline-flex;
    align-items: stretch;
    min-height: var(--emr-control-height);
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    overflow: hidden;
    max-width: 100%;
  }
  .stepper-box--invalid {
    border-color: var(--emr-danger);
  }
  .stepper-action-btn {
    width: 44px;
    min-width: 44px;
    min-height: 44px;
    border: 0;
    background: var(--emr-surface-soft);
    color: var(--emr-text);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
  }
  .stepper-action-btn:hover:not(:disabled) {
    background: var(--emr-primary-hover);
  }
  .stepper-action-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .stepper-field {
    width: 96px;
    min-width: 64px;
    border: 0;
    background: transparent;
    color: var(--emr-text);
    text-align: center;
    font: inherit;
    font-size: var(--emr-text-md);
    font-variant-numeric: tabular-nums;
    outline: none;
  }
  .stepper-row {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .checkbox-group-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .checkbox-group-list--horizontal {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .checkbox-group-list--grid {
    display: grid;
    grid-template-columns: repeat(var(--cols, 2), minmax(140px, 1fr));
    gap: 8px;
  }
  .checkbox-row-btn {
    min-height: 44px;
    min-width: 44px;
    padding: 8px 12px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-medium);
    display: inline-flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    text-align: left;
  }
  .checkbox-row-btn--card {
    padding: 10px 14px;
    align-items: flex-start;
  }
  .checkbox-row-btn--chip {
    border-radius: 999px;
  }
  .checkbox-row-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .checkbox-row-desc {
    color: var(--emr-text-muted);
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-medium);
  }
  .checkbox-row-btn[aria-checked="true"],
  .checkbox-row-btn[aria-checked="mixed"] {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
    color: var(--emr-primary-contrast);
  }
  .checkbox-row-btn--readonly {
    background: var(--emr-surface-soft);
    cursor: default;
  }
  .checkbox-row-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .checkbox-box {
    width: 18px;
    height: 18px;
    border: 1.5px solid var(--emr-border);
    border-radius: 4px;
    background: var(--emr-surface);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .checkbox-row-btn[aria-checked="true"] .checkbox-box,
  .checkbox-row-btn[aria-checked="mixed"] .checkbox-box {
    border-color: var(--emr-primary);
    background: var(--emr-primary);
    color: var(--emr-on-primary);
  }
  .clear-inline-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 0 10px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface-soft);
    color: var(--emr-text-muted);
    font: inherit;
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-semibold);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    flex-shrink: 0;
  }
  .clear-inline-btn:hover:not(:disabled) {
    background: var(--emr-primary-soft);
    color: var(--emr-primary);
  }

  .pagination-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .pagination-controls {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }
  .page-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-medium);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .page-btn[aria-current="page"] {
    border-color: var(--emr-primary);
    background: var(--emr-primary);
    color: var(--emr-on-primary);
    font-weight: var(--emr-weight-bold);
  }
  .page-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .page-size-select {
    width: auto;
    min-width: 96px;
  }

  .dialog-backdrop {
    position: fixed;
    inset: 0;
    z-index: 10000;
    background: var(--emr-backdrop);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  .dialog-surface {
    width: 100%;
    max-height: calc(100vh - 32px);
    overflow: auto;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius-lg);
    background: var(--emr-surface);
    color: var(--emr-text);
    box-shadow: var(--emr-shadow);
    padding: 20px;
    display: grid;
    gap: 14px;
  }
  .dialog-surface--sm { max-width: 400px; }
  .dialog-surface--md { max-width: 560px; }
  .dialog-surface--lg { max-width: 780px; }
  .dialog-surface--fullscreen {
    max-width: 100%;
    height: calc(100vh - 32px);
  }
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
  }

  .popover-root {
    position: relative;
    display: inline-block;
  }
  .popover-trigger {
    display: inline-flex;
  }
  .popover-panel {
    position: absolute;
    top: calc(100% + 6px);
    z-index: 9999;
    min-width: 200px;
    padding: 12px;
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
    color: var(--emr-text);
    box-shadow: var(--emr-shadow);
  }
  .popover-panel--start { left: 0; }
  .popover-panel--end { right: 0; }

  .tooltip-root {
    position: relative;
    display: inline-flex;
    align-items: center;
  }
  .tooltip-bubble {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000;
    padding: 6px 10px;
    border-radius: var(--emr-radius-sm);
    border: 1px solid var(--emr-border);
    background: var(--emr-text);
    color: var(--emr-surface);
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-medium);
    white-space: nowrap;
    pointer-events: none;
    box-shadow: var(--emr-shadow);
  }

  .progress-track {
    width: 100%;
    height: 10px;
    border-radius: 999px;
    background: var(--emr-surface-soft);
    border: 1px solid var(--emr-border);
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    border-radius: 999px;
    background: var(--emr-primary);
    transition: width 160ms ease;
  }
  .progress-fill--neutral { background: var(--emr-primary); }
  .progress-fill--info { background: var(--emr-info); }
  .progress-fill--success { background: var(--emr-success); }
  .progress-fill--warning { background: var(--emr-warning); }
  .progress-fill--danger { background: var(--emr-danger); }
  .progress-fill--indeterminate {
    width: 40% !important;
    animation: emr-progress-slide 1.2s ease-in-out infinite;
  }
  @keyframes emr-progress-slide {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(260%); }
  }

  .spinner-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .spinner-ring {
    display: inline-block;
    border-radius: 999px;
    border: 2.5px solid var(--emr-border);
    border-top-color: var(--emr-primary);
    animation: emr-spin 0.8s linear infinite;
  }
  .spinner-ring--sm { width: 16px; height: 16px; border-width: 2px; }
  .spinner-ring--md { width: 24px; height: 24px; }
  .spinner-ring--lg { width: 36px; height: 36px; border-width: 3px; }
  .spinner-ring--neutral { border-top-color: var(--emr-primary); }
  .spinner-ring--info { border-top-color: var(--emr-info); }
  .spinner-ring--success { border-top-color: var(--emr-success); }
  .spinner-ring--warning { border-top-color: var(--emr-warning); }
  .spinner-ring--danger { border-top-color: var(--emr-danger); }
  @keyframes emr-spin {
    to { transform: rotate(360deg); }
  }

  .skeleton-stack {
    display: grid;
    gap: 8px;
  }
  .skeleton-block {
    display: block;
    background: var(--emr-surface-soft);
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius-sm);
    animation: emr-pulse 1.4s ease-in-out infinite;
  }
  .skeleton-block--line {
    width: 100%;
    height: 14px;
  }
  .skeleton-block--rect {
    width: 100%;
    height: 64px;
    border-radius: var(--emr-radius);
  }
  .skeleton-block--circle {
    width: 40px;
    height: 40px;
    border-radius: 999px;
  }
  @keyframes emr-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    overflow: hidden;
    font-weight: var(--emr-weight-bold);
    flex-shrink: 0;
    padding: 0;
  }
  .avatar--sm { width: 32px; height: 32px; font-size: var(--emr-text-xs); }
  .avatar--md { width: 40px; height: 40px; font-size: var(--emr-text-sm); }
  .avatar--lg { width: 52px; height: 52px; font-size: var(--emr-text-md); }
  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .drop-zone {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    padding: 10px 12px;
    border: 1.5px dashed var(--emr-border);
    border-radius: var(--emr-radius);
    background: var(--emr-surface);
  }
  .drop-zone--over {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
  }
  .drop-zone--disabled {
    opacity: 0.55;
  }
`;

/** 1. EmrTextareaElement (`emr-textarea`) */
export class EmrTextareaElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1ExtraStyles];

  private readonly fallbackId = nextL1ExtraId('emr-textarea');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) value: string | null = null;
  @property({ type: Number }) rows = 4;
  @property({ type: Number }) maxLength?: number;
  @property({ type: Boolean }) autoResize = false;
  @property({ type: String }) placeholder = '';
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (this.autoResize && (changed.has('value') || changed.has('autoResize'))) {
      this.syncAutoHeight();
    }
  }

  private syncAutoHeight(): void {
    const area = this.shadowRoot?.querySelector<HTMLTextAreaElement>('textarea');
    if (!area || !this.autoResize) return;
    area.style.height = 'auto';
    if (area.scrollHeight > 0) {
      area.style.height = `${area.scrollHeight}px`;
    }
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const currentText = this.value ?? '';
    const textarea = html`<textarea
      id=${id}
      part="control"
      class="emr-control"
      rows=${this.rows}
      maxlength=${this.maxLength ?? nothing}
      placeholder=${this.placeholder}
      .value=${this.locked ? live(currentText) : currentText}
      ?readonly=${this.readOnly}
      ?disabled=${this.disabled}
      ?required=${this.required}
      aria-label=${this.labelHidden && this.label ? this.label : nothing}
      aria-invalid=${this.error ? 'true' : nothing}
      aria-describedby=${!this.labelHidden && (this.error || this.hint) ? msgId : nothing}
      @blur=${(e: Event) => {
        (e.target as HTMLTextAreaElement).value = this.value ?? '';
        this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
      }}
      @input=${(e: Event) => {
        if (this.locked) {
          (e.target as HTMLTextAreaElement).value = this.value ?? '';
          return;
        }
        if (this.autoResize) this.syncAutoHeight();
        const raw = (e.target as HTMLTextAreaElement).value;
        this.emitValueChange(raw === '' ? null : raw);
      }}
    ></textarea>`;

    if (this.labelHidden) return textarea;

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<label class="emr-label" for=${id}>${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</label>`
        : nothing}
      ${textarea}
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
        : this.hint
          ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
          : nothing}
    </div>`;
  }
}

/** 2. EmrIconButtonElement (`emr-icon-button`) */
export class EmrIconButtonElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1ExtraStyles];

  private readonly fallbackId = nextL1ExtraId('emr-icon-button');

  @property({ type: String }) controlId = '';
  @property({ type: String }) override ariaLabel: string | null = '';
  @property({ type: String }) icon = '';
  @property({ type: String }) variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' = 'ghost';
  @property({ type: String }) size: 'sm' | 'md' | 'lg' = 'md';
  @property({ type: Boolean }) pressed?: boolean;
  @property({ type: Boolean }) loading = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) type: 'button' | 'submit' | 'reset' = 'button';

  override render() {
    const id = this.controlId || this.fallbackId;
    const classes = [
      'emr-btn',
      'icon-btn',
      this.variant !== 'primary' ? `emr-btn--${this.variant}` : '',
      this.size !== 'md' ? `emr-btn--${this.size}` : '',
    ].filter(Boolean).join(' ');
    const iconSize = this.size === 'lg' ? 20 : 18;

    return html`<button
      id=${id}
      part="button"
      type=${this.type}
      class=${classes}
      aria-label=${this.ariaLabel || nothing}
      aria-pressed=${this.pressed === undefined ? nothing : String(this.pressed)}
      aria-busy=${this.loading ? 'true' : nothing}
      ?disabled=${this.disabled || this.loading}
      @click=${() => {
        if (!this.disabled && !this.loading) {
          this.dispatchEvent(new CustomEvent('clicked', { bubbles: true, composed: true }));
        }
      }}
    >
      ${this.icon ? renderEmrSvgIcon(this.icon as EmrLitIconName, iconSize) : nothing}
      <slot></slot>
    </button>`;
  }
}

/** 3. EmrSegmentedControlElement (`emr-segmented-control`) */
export class EmrSegmentedControlElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1ExtraStyles];

  private readonly fallbackId = nextL1ExtraId('emr-segmented');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) override ariaLabel: string | null = '';
  @property({ attribute: false }) options: readonly EmrSegmentedOption[] = [];
  @property({ type: String }) value: string | null = null;
  @property({ type: Boolean }) clearable = false;
  @property({ type: String }) clearLabel = 'Clear';
  @property({ type: Boolean }) allowDeselect = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';

  private clearSelection(): void {
    if (this.readOnly || this.disabled) return;
    this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
    this.emitValueChange(null);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    const container = event.currentTarget as HTMLElement;
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('button[role="radio"]'));
    const enabled = buttons.map((btn, idx) => ({ btn, idx })).filter(({ btn }) => !btn.disabled);
    if (!enabled.length) return;
    const cur = enabled.findIndex(({ btn }) => btn === event.target);
    if (cur < 0) return;
    event.preventDefault();
    const nextIdx = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? enabled.length - 1
        : (cur + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length;
    const target = enabled[nextIdx]!;
    target.btn.focus();
    if (!this.readOnly && !this.disabled) {
      const opt = this.options[target.idx];
      if (opt && !opt.disabled) this.emitValueChange(opt.value);
    }
  };

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const groupLabel = this.ariaLabel || this.label || 'Options';
    const showClear = this.clearable && this.value !== null && this.value !== '' && !this.readOnly && !this.disabled;
    const clearBtn = showClear
      ? html`<button
          type="button"
          class="clear-inline-btn"
          data-clear-btn="true"
          aria-label=${`${this.clearLabel} ${groupLabel}`}
          @click=${() => this.clearSelection()}
        >${this.clearLabel}</button>`
      : nothing;

    const track = html`<div
      id=${id}
      role="radiogroup"
      part="track"
      class="segmented-track"
      aria-label=${groupLabel}
      aria-readonly=${this.readOnly ? 'true' : nothing}
      aria-describedby=${!this.labelHidden && (this.error || this.hint) ? msgId : nothing}
      @keydown=${this.onKeyDown}
    >
      ${this.options.map((opt, idx) => {
        const selected = this.value === opt.value;
        const isTabStop = selected || (this.value == null && idx === 0);
        return html`<button
          type="button"
          role="radio"
          class="segmented-item"
          aria-checked=${String(selected)}
          aria-readonly=${this.readOnly ? 'true' : nothing}
          tabindex=${isTabStop ? '0' : '-1'}
          ?disabled=${this.disabled || !!opt.disabled}
          @click=${() => {
            if (this.readOnly || this.disabled || opt.disabled) return;
            if (selected && this.allowDeselect) {
              this.clearSelection();
              return;
            }
            this.emitValueChange(opt.value);
          }}
        >
          <span>${opt.label}</span>
          ${opt.badge ? html`<span class="emr-badge">${opt.badge}</span>` : nothing}
        </button>`;
      })}
    </div>`;

    if (this.labelHidden) {
      return showClear ? html`<div class="emr-row">${track}${clearBtn}</div>` : track;
    }

    return html`<div class="emr-field" part="field">
      ${this.label || showClear
        ? html`<div class="emr-header">
            ${this.label ? html`<span class="emr-label">${this.label}</span>` : html`<span></span>`}
            ${clearBtn}
          </div>`
        : nothing}
      ${track}
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
        : this.hint
          ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
          : nothing}
    </div>`;
  }
}

/** 4. EmrSearchInputElement (`emr-search-input`) */
export class EmrSearchInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1ExtraStyles];

  private readonly fallbackId = nextL1ExtraId('emr-search-input');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) value: string | null = null;
  @property({ type: String }) placeholder = 'Search…';
  @property({ type: Boolean }) loading = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const current = this.value ?? '';
    const shellCls = [
      'input-shell',
      this.error ? 'input-shell--invalid' : '',
      this.readOnly ? 'input-shell--readonly' : '',
    ].filter(Boolean).join(' ');

    const shell = html`<div class=${shellCls} part="control">
      <span class="input-leading" aria-hidden="true">${renderEmrSvgIcon('search', 16)}</span>
      <input
        id=${id}
        class="input-bare"
        type="search"
        placeholder=${this.placeholder}
        .value=${this.locked ? live(current) : current}
        ?readonly=${this.readOnly}
        ?disabled=${this.disabled}
        aria-label=${this.labelHidden ? this.label || 'Search' : nothing}
        aria-invalid=${this.error ? 'true' : nothing}
        aria-describedby=${!this.labelHidden && (this.error || this.hint) ? msgId : nothing}
        @blur=${(e: Event) => {
          (e.target as HTMLInputElement).value = this.value ?? '';
        }}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === 'Enter' && !this.locked) {
            e.preventDefault();
            this.dispatchEvent(
              new CustomEvent<string>('submitted', {
                detail: (e.target as HTMLInputElement).value,
                bubbles: true,
                composed: true,
              }),
            );
          }
        }}
        @input=${(e: Event) => {
          if (this.locked) {
            (e.target as HTMLInputElement).value = this.value ?? '';
            return;
          }
          const raw = (e.target as HTMLInputElement).value;
          this.emitValueChange(raw === '' ? null : raw);
        }}
      />
      ${this.loading ? html`<span class="input-leading" role="status" aria-label="Searching">…</span>` : nothing}
      ${current.length > 0 && !this.locked
        ? html`<button
            type="button"
            class="input-affix-btn"
            aria-label="Clear search"
            @click=${() => {
              if (this.locked) return;
              this.emitValueChange(null);
              this.dispatchEvent(new CustomEvent('cleared', { bubbles: true, composed: true }));
            }}
          >${renderEmrSvgIcon('close', 14)}</button>`
        : nothing}
    </div>`;

    if (this.labelHidden) return shell;

    return html`<div class="emr-field" part="field">
      ${this.label ? html`<label class="emr-label" for=${id}>${this.label}</label>` : nothing}
      ${shell}
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
        : this.hint
          ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
          : nothing}
    </div>`;
  }
}

/** 5. EmrPasswordInputElement (`emr-password-input`) */
export class EmrPasswordInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1ExtraStyles];

  private readonly fallbackId = nextL1ExtraId('emr-password-input');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) value: string | null = null;
  @property({ type: String }) placeholder = '';
  @property({ type: String }) autocomplete = 'current-password';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';

  @state() private revealed = false;

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const current = this.value ?? '';
    const shellCls = [
      'input-shell',
      this.error ? 'input-shell--invalid' : '',
      this.readOnly ? 'input-shell--readonly' : '',
    ].filter(Boolean).join(' ');

    const shell = html`<div class=${shellCls} part="control">
      <input
        id=${id}
        class="input-bare"
        type=${this.revealed ? 'text' : 'password'}
        autocomplete=${this.autocomplete}
        placeholder=${this.placeholder}
        .value=${this.locked ? live(current) : current}
        ?readonly=${this.readOnly}
        ?disabled=${this.disabled}
        ?required=${this.required}
        aria-label=${this.labelHidden && this.label ? this.label : nothing}
        aria-invalid=${this.error ? 'true' : nothing}
        aria-describedby=${!this.labelHidden && (this.error || this.hint) ? msgId : nothing}
        @blur=${(e: Event) => {
          (e.target as HTMLInputElement).value = this.value ?? '';
          this.dispatchEvent(new CustomEvent('blurred', { bubbles: true, composed: true }));
        }}
        @input=${(e: Event) => {
          if (this.locked) {
            (e.target as HTMLInputElement).value = this.value ?? '';
            return;
          }
          const raw = (e.target as HTMLInputElement).value;
          this.emitValueChange(raw === '' ? null : raw);
        }}
      />
      <button
        type="button"
        class="input-affix-btn"
        aria-label=${this.revealed ? 'Hide password' : 'Show password'}
        aria-pressed=${String(this.revealed)}
        ?disabled=${this.disabled}
        @click=${() => {
          if (!this.disabled) this.revealed = !this.revealed;
        }}
      >
        ${renderEmrSvgIcon(this.revealed ? 'eye-off' : 'eye', 16)}
        <span>${this.revealed ? 'Hide' : 'Show'}</span>
      </button>
    </div>`;

    if (this.labelHidden) return shell;

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<label class="emr-label" for=${id}>${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</label>`
        : nothing}
      ${shell}
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
        : this.hint
          ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
          : nothing}
    </div>`;
  }
}

/** 6. EmrNumericStepperElement (`emr-numeric-stepper`) */
export class EmrNumericStepperElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1ExtraStyles];

  private readonly fallbackId = nextL1ExtraId('emr-numeric-stepper');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: Number }) value: number | null = null;
  @property({ type: Number }) min?: number;
  @property({ type: Number }) max?: number;
  @property({ type: Number }) step = 1;
  @property({ type: Number }) precision?: number;
  @property({ type: String }) unit = '';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';

  private draft?: { text: string; base: number | null; parsed: number | null | undefined };

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private roundValue(raw: number): number {
    if (this.precision !== undefined && this.precision >= 0) {
      return Number(raw.toFixed(this.precision));
    }
    return Math.round(raw * 10000) / 10000;
  }

  private stepBy(dir: -1 | 1): void {
    if (this.locked) return;
    this.draft = undefined;
    const base = this.value ?? (this.min !== undefined && this.min > 0 ? this.min : 0);
    let next = this.roundValue(base + dir * (this.step || 1));
    if (this.min !== undefined && next < this.min) next = this.min;
    if (this.max !== undefined && next > this.max) next = this.max;
    this.emitValueChange(next);
  }

  override render() {
    if (this.locked) this.draft = undefined;
    if (this.draft && this.value !== this.draft.base && this.value !== this.draft.parsed) {
      this.draft = undefined;
    }
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const formatted =
      this.value == null
        ? ''
        : this.precision !== undefined && this.precision >= 0
          ? this.value.toFixed(this.precision)
          : String(this.value);
    const shown = this.locked
      ? formatted
      : this.draft && (this.value === this.draft.base || this.value === this.draft.parsed)
        ? this.draft.text
        : formatted;

    const atMin = this.min !== undefined && this.value !== null && this.value <= this.min;
    const atMax = this.max !== undefined && this.value !== null && this.value >= this.max;

    const row = html`<div class="stepper-row">
      <div class=${`stepper-box${this.error ? ' stepper-box--invalid' : ''}`} part="stepper">
        ${!this.readOnly
          ? html`<button
              type="button"
              class="stepper-action-btn"
              aria-label="Decrease value"
              ?disabled=${this.disabled || atMin}
              @click=${() => this.stepBy(-1)}
            >${renderEmrSvgIcon('minus', 16)}</button>`
          : nothing}
        <input
          id=${id}
          part="control"
          class="stepper-field"
          type="text"
          inputmode=${this.precision === 0 ? 'numeric' : 'decimal'}
          .value=${this.locked ? live(formatted) : shown}
          ?readonly=${this.readOnly}
          ?disabled=${this.disabled}
          ?required=${this.required}
          aria-label=${this.labelHidden && this.label ? this.label : nothing}
          aria-invalid=${this.error ? 'true' : nothing}
          aria-describedby=${!this.labelHidden && (this.error || this.hint) ? msgId : nothing}
          @blur=${(e: Event) => {
            this.draft = undefined;
            (e.target as HTMLInputElement).value = formatted;
          }}
          @input=${(e: Event) => {
            if (this.locked) {
              (e.target as HTMLInputElement).value = formatted;
              return;
            }
            const raw = (e.target as HTMLInputElement).value.trim();
            const parsed = raw === '' ? null : Number(raw);
            const valid = parsed === null || Number.isFinite(parsed);
            const clamped =
              parsed !== null && Number.isFinite(parsed)
                ? this.roundValue(
                    Math.min(
                      this.max ?? Number.POSITIVE_INFINITY,
                      Math.max(this.min ?? Number.NEGATIVE_INFINITY, parsed),
                    ),
                  )
                : parsed;
            this.draft = {
              text: (e.target as HTMLInputElement).value,
              base: this.value,
              parsed: valid ? clamped : undefined,
            };
            if (valid) {
              this.emitValueChange(clamped);
            }
          }}
        />
        ${!this.readOnly
          ? html`<button
              type="button"
              class="stepper-action-btn"
              aria-label="Increase value"
              ?disabled=${this.disabled || atMax}
              @click=${() => this.stepBy(1)}
            >${renderEmrSvgIcon('plus', 16)}</button>`
          : nothing}
      </div>
      ${this.unit ? html`<span class="emr-muted" aria-hidden="true">${this.unit}</span>` : nothing}
    </div>`;

    if (this.labelHidden) return row;

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<label class="emr-label" for=${id}>${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</label>`
        : nothing}
      ${row}
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
        : this.hint
          ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
          : nothing}
    </div>`;
  }
}

/** 7. EmrCheckboxGroupElement (`emr-checkbox-group`) */
export class EmrCheckboxGroupElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1ExtraStyles];

  private readonly fallbackId = nextL1ExtraId('emr-checkbox-group');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ attribute: false }) options: readonly EmrOption[] = [];
  @property({ attribute: false }) value: readonly string[] = [];
  @property({ type: String }) orientation: 'vertical' | 'horizontal' | 'grid' = 'vertical';
  @property({ type: Number }) columns = 2;
  @property({ type: String }) variant: 'standard' | 'card' | 'chip' = 'standard';
  @property({ type: Boolean }) showSelectAll = false;
  @property({ type: String }) selectAllLabel = 'Select all';
  @property({ attribute: false }) exclusiveValues: readonly string[] = [];
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';

  private toggleOption(optValue: string): void {
    if (this.readOnly || this.disabled) return;
    const current = Array.isArray(this.value) ? this.value : [];
    const next = toggleCheckboxGroupValue(current, optValue, this.options, this.exclusiveValues);
    this.emitValueChange(next);
  }

  private toggleSelectAll(): void {
    if (this.readOnly || this.disabled) return;
    const current = Array.isArray(this.value) ? this.value : [];
    const next = toggleSelectAllValues(current, this.options, this.exclusiveValues);
    this.emitValueChange(next);
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const listCls = [
      'checkbox-group-list',
      this.orientation === 'horizontal' ? 'checkbox-group-list--horizontal' : '',
      this.orientation === 'grid' ? 'checkbox-group-list--grid' : '',
    ].filter(Boolean).join(' ');
    const listStyle = this.orientation === 'grid' ? `--cols: ${Math.max(1, this.columns)};` : '';
    const selectedSet = new Set(this.value ?? []);
    const selectAllState = this.showSelectAll
      ? computeSelectAllState(this.value ?? [], this.options, this.exclusiveValues)
      : 'none';
    const variantCls =
      this.variant === 'card'
        ? ' checkbox-row-btn--card'
        : this.variant === 'chip'
          ? ' checkbox-row-btn--chip'
          : '';

    const group = html`<div
      id=${id}
      role="group"
      class=${listCls}
      data-orientation=${this.orientation}
      data-variant=${this.variant}
      style=${listStyle}
      aria-label=${this.label || 'Options'}
      aria-describedby=${!this.labelHidden && (this.error || this.hint) ? msgId : nothing}
    >
      ${this.showSelectAll
        ? html`<button
            type="button"
            role="checkbox"
            data-select-all="true"
            class=${`checkbox-row-btn${this.readOnly ? ' checkbox-row-btn--readonly' : ''}${variantCls}`}
            aria-checked=${selectAllState === 'mixed' ? 'mixed' : String(selectAllState === 'all')}
            aria-readonly=${this.readOnly ? 'true' : nothing}
            ?disabled=${this.disabled}
            @click=${() => this.toggleSelectAll()}
          >
            <span class="checkbox-box" aria-hidden="true">
              ${selectAllState === 'mixed' ? '–' : selectAllState === 'all' ? renderEmrSvgIcon('check', 12) : nothing}
            </span>
            <span>${this.selectAllLabel}</span>
          </button>`
        : nothing}
      ${this.options.map(opt => {
        const checked = selectedSet.has(opt.value);
        const btnCls = `checkbox-row-btn${this.readOnly ? ' checkbox-row-btn--readonly' : ''}${variantCls}`;
        return html`<button
          type="button"
          role="checkbox"
          class=${btnCls}
          aria-checked=${String(checked)}
          aria-readonly=${this.readOnly ? 'true' : nothing}
          ?disabled=${this.disabled || !!opt.disabled}
          @click=${() => {
            if (opt.disabled) return;
            this.toggleOption(opt.value);
          }}
        >
          <span class="checkbox-box" aria-hidden="true">${checked ? renderEmrSvgIcon('check', 12) : nothing}</span>
          <span class="checkbox-row-copy">
            <span>${opt.label}</span>
            ${opt.description ? html`<span class="checkbox-row-desc">${opt.description}</span>` : nothing}
          </span>
        </button>`;
      })}
    </div>`;

    if (this.labelHidden) return group;

    return html`<div class="emr-field" part="field">
      ${this.label
        ? html`<span class="emr-label">${this.label}${this.required ? html`<span class="emr-error" aria-hidden="true"> *</span>` : nothing}</span>`
        : nothing}
      ${group}
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
        : this.hint
          ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
          : nothing}
    </div>`;
  }
}

/** 8. EmrPaginationElement (`emr-pagination`) */
export class EmrPaginationElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1ExtraStyles];

  @property({ type: Number }) page = 1;
  @property({ type: Number }) pageSize = 20;
  @property({ type: Number }) totalItems = 0;
  @property({ attribute: false }) pageSizeOptions: readonly number[] = [];
  @property({ type: String }) override ariaLabel: string | null = 'Pagination';
  @property({ type: Boolean }) disabled = false;

  private get totalPages(): number {
    const size = Math.max(1, this.pageSize || 20);
    return Math.max(1, Math.ceil(Math.max(0, this.totalItems) / size));
  }

  private emitPage(nextPage: number): void {
    if (this.disabled) return;
    const bounded = Math.min(this.totalPages, Math.max(1, nextPage));
    if (bounded === this.page) return;
    this.dispatchEvent(new CustomEvent<number>('pageChange', { detail: bounded, bubbles: true, composed: true }));
  }

  override render() {
    const totalPages = this.totalPages;
    const currentPage = Math.min(totalPages, Math.max(1, this.page || 1));
    const size = Math.max(1, this.pageSize || 20);
    const start = this.totalItems === 0 ? 0 : (currentPage - 1) * size + 1;
    const end = Math.min(this.totalItems, currentPage * size);

    const pages: number[] = [];
    const windowStart = Math.max(1, currentPage - 2);
    const windowEnd = Math.min(totalPages, windowStart + 4);
    for (let p = Math.max(1, windowEnd - 4); p <= windowEnd; p++) {
      pages.push(p);
    }

    return html`<nav class="pagination-nav" aria-label=${this.ariaLabel || 'Pagination'}>
      <span class="emr-muted">
        ${this.totalItems === 0 ? '0 items' : `${start}–${end} of ${this.totalItems}`}
      </span>
      <div class="pagination-controls">
        ${this.pageSizeOptions.length > 0
          ? html`<select
              class="emr-control page-size-select"
              aria-label="Items per page"
              .value=${live(String(this.pageSize))}
              ?disabled=${this.disabled}
              @change=${(e: Event) => {
                const select = e.target as HTMLSelectElement;
                const chosen = Number(select.value);
                select.value = String(this.pageSize);
                if (!this.disabled && Number.isFinite(chosen) && chosen > 0) {
                  this.dispatchEvent(
                    new CustomEvent<number>('pageSizeChange', { detail: chosen, bubbles: true, composed: true }),
                  );
                }
              }}
            >
              ${this.pageSizeOptions.map(
                opt => html`<option value=${String(opt)} ?selected=${opt === this.pageSize}>${opt} / page</option>`,
              )}
            </select>`
          : nothing}
        <button
          type="button"
          class="page-btn"
          aria-label="Previous page"
          ?disabled=${this.disabled || currentPage <= 1}
          @click=${() => this.emitPage(currentPage - 1)}
        >Previous</button>
        ${pages.map(
          p => html`<button
            type="button"
            class="page-btn"
            aria-label=${`Page ${p}`}
            aria-current=${p === currentPage ? 'page' : nothing}
            ?disabled=${this.disabled}
            @click=${() => this.emitPage(p)}
          >${p}</button>`,
        )}
        <button
          type="button"
          class="page-btn"
          aria-label="Next page"
          ?disabled=${this.disabled || currentPage >= totalPages}
          @click=${() => this.emitPage(currentPage + 1)}
        >Next</button>
      </div>
    </nav>`;
  }
}

/** 9. EmrDialogElement (`emr-dialog`) */
export class EmrDialogElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1ExtraStyles];

  private readonly fallbackHeadingId = nextL1ExtraId('emr-dialog-title');

  @property({ type: Boolean }) open = false;
  @property({ type: String }) override title = '';
  @property({ type: String }) description = '';
  @property({ type: String }) size: 'sm' | 'md' | 'lg' | 'fullscreen' = 'md';
  @property({ type: String }) override role: string | null = 'dialog';
  @property({ type: Boolean }) dismissible = true;
  @property({ type: String }) headingId = '';

  private onDocumentKeyDown = (event: KeyboardEvent): void => {
    if (!this.open) return;
    if (event.key === 'Escape' && this.dismissible) {
      event.preventDefault();
      this.requestClose();
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', this.onDocumentKeyDown);
    }
  }

  override disconnectedCallback(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.onDocumentKeyDown);
    }
    super.disconnectedCallback();
  }

  private requestClose(): void {
    if (!this.open || !this.dismissible) return;
    this.dispatchEvent(new CustomEvent('closeRequested', { bubbles: true, composed: true }));
  }

  private getFocusableElements(): HTMLElement[] {
    const selector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const shadowFocusable = Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>(selector) ?? []);
    const lightFocusable = Array.from(this.querySelectorAll<HTMLElement>(selector));
    return [...shadowFocusable, ...lightFocusable];
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has('open') && this.open) {
      const focusable = this.getFocusableElements();
      const surface = this.shadowRoot?.querySelector<HTMLElement>('.dialog-surface');
      (focusable[0] ?? surface)?.focus();
    }
  }

  private onDialogKeyDown = (event: KeyboardEvent): void => {
    if (!this.open) return;
    if (event.key === 'Escape' && this.dismissible) {
      event.preventDefault();
      event.stopPropagation();
      this.requestClose();
      return;
    }
    if (event.key === 'Tab') {
      const focusable = this.getFocusableElements();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = (this.shadowRoot?.activeElement ?? document.activeElement) as HTMLElement | null;
      if (event.shiftKey) {
        if (!active || active === first || !focusable.includes(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  override render() {
    if (!this.open) return nothing;
    const titleId = this.headingId || this.fallbackHeadingId;
    const descId = `${titleId}-desc`;
    const dialogRole = this.role === 'alertdialog' ? 'alertdialog' : 'dialog';

    return html`<div
      class="dialog-backdrop"
      part="backdrop"
      @click=${(e: MouseEvent) => {
        if (e.target === e.currentTarget && this.dismissible) {
          this.requestClose();
        }
      }}
      @keydown=${this.onDialogKeyDown}
    >
      <div
        class=${`dialog-surface dialog-surface--${this.size}`}
        part="dialog"
        role=${dialogRole}
        tabindex="-1"
        aria-modal="true"
        aria-labelledby=${this.title ? titleId : nothing}
        aria-label=${!this.title ? 'Dialog' : nothing}
        aria-describedby=${this.description ? descId : nothing}
      >
        <header class="emr-header">
          ${this.title ? html`<h3 id=${titleId} class="emr-title">${this.title}</h3>` : html`<span></span>`}
          ${this.dismissible
            ? html`<button
                type="button"
                class="emr-btn emr-btn--ghost icon-btn"
                aria-label="Close dialog"
                @click=${() => this.requestClose()}
              >${renderEmrSvgIcon('close', 18)}</button>`
            : nothing}
        </header>
        ${this.description ? html`<p id=${descId} class="emr-muted">${this.description}</p>` : nothing}
        <div class="dialog-body"><slot></slot></div>
        <footer class="dialog-footer"><slot name="footer"></slot></footer>
      </div>
    </div>`;
  }
}

/** 10. EmrPopoverElement (`emr-popover`) */
export class EmrPopoverElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1ExtraStyles];

  @property({ type: Boolean }) open = false;
  @property({ type: String }) label = 'Options';
  @property({ type: String }) align: 'start' | 'end' = 'start';

  private onOutsidePointerDown = (event: Event): void => {
    if (!this.open) return;
    if (!event.composedPath().includes(this)) {
      this.emitOpenChange(false);
    }
  };

  private onGlobalKeyDown = (event: KeyboardEvent): void => {
    if (this.open && event.key === 'Escape') {
      event.stopPropagation();
      this.emitOpenChange(false);
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    if (typeof document !== 'undefined') {
      document.addEventListener('pointerdown', this.onOutsidePointerDown, true);
      document.addEventListener('keydown', this.onGlobalKeyDown, true);
    }
  }

  override disconnectedCallback(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('pointerdown', this.onOutsidePointerDown, true);
      document.removeEventListener('keydown', this.onGlobalKeyDown, true);
    }
    super.disconnectedCallback();
  }

  private emitOpenChange(next: boolean): void {
    this.dispatchEvent(new CustomEvent<boolean>('openChange', { detail: next, bubbles: true, composed: true }));
  }

  override render() {
    return html`<div class="popover-root">
      <div
        class="popover-trigger"
        @click=${() => {
          this.emitOpenChange(!this.open);
        }}
      >
        <slot name="trigger"></slot>
      </div>
      ${this.open
        ? html`<div
            class=${`popover-panel popover-panel--${this.align === 'end' ? 'end' : 'start'}`}
            part="panel"
            role="dialog"
            aria-label=${this.label}
          >
            <slot></slot>
          </div>`
        : nothing}
    </div>`;
  }
}

/** 11. EmrTooltipElement (`emr-tooltip`) */
export class EmrTooltipElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1ExtraStyles];

  private readonly fallbackId = nextL1ExtraId('emr-tooltip');

  @property({ type: String }) content = '';
  @property({ type: String }) controlId = '';
  @property({ type: Boolean }) disabled = false;

  @state() private active = false;

  override render() {
    const id = this.controlId || this.fallbackId;
    const visible = this.active && !this.disabled && !!this.content;

    return html`<span
      class="tooltip-root"
      aria-describedby=${visible ? id : nothing}
      @mouseenter=${() => {
        if (!this.disabled) this.active = true;
      }}
      @mouseleave=${() => {
        this.active = false;
      }}
      @focusin=${() => {
        if (!this.disabled) this.active = true;
      }}
      @focusout=${() => {
        this.active = false;
      }}
      @keydown=${(e: KeyboardEvent) => {
        if (e.key === 'Escape') this.active = false;
      }}
    >
      <slot></slot>
      ${visible ? html`<span id=${id} role="tooltip" class="tooltip-bubble">${this.content}</span>` : nothing}
    </span>`;
  }
}

/** 12. EmrProgressBarElement (`emr-progress-bar`) */
export class EmrProgressBarElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1ExtraStyles];

  @property({ type: String }) label = '';
  @property({ type: Number }) value: number | null = null;
  @property({ type: Number }) max = 100;
  @property({ type: Boolean }) indeterminate = false;
  @property({ type: String }) tone: EmrTone = 'info';
  @property({ type: String }) valueLabel = '';

  override render() {
    const safeMax = this.max > 0 ? this.max : 100;
    const pct =
      this.value == null
        ? 0
        : Math.min(100, Math.max(0, (this.value / safeMax) * 100));
    const displayValue =
      this.valueLabel ||
      (!this.indeterminate && this.value != null ? `${Math.round(pct)}%` : '');

    return html`<div class="emr-field" part="progress">
      ${this.label || displayValue
        ? html`<div class="emr-header">
            ${this.label ? html`<span class="emr-label">${this.label}</span>` : html`<span></span>`}
            ${displayValue ? html`<span class="emr-muted">${displayValue}</span>` : nothing}
          </div>`
        : nothing}
      <div
        class="progress-track"
        role="progressbar"
        aria-label=${this.label || 'Progress'}
        aria-valuemin="0"
        aria-valuemax=${String(safeMax)}
        aria-valuenow=${this.indeterminate || this.value == null ? nothing : String(this.value)}
        aria-valuetext=${this.valueLabel || nothing}
      >
        <div
          class=${`progress-fill progress-fill--${this.tone}${this.indeterminate ? ' progress-fill--indeterminate' : ''}`}
          style=${`width: ${pct}%;`}
        ></div>
      </div>
    </div>`;
  }
}

/** 13. EmrSpinnerElement (`emr-spinner`) */
export class EmrSpinnerElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1ExtraStyles];

  @property({ type: String }) label = 'Loading';
  @property({ type: String }) size: 'sm' | 'md' | 'lg' = 'md';
  @property({ type: String }) tone: EmrTone = 'info';

  override render() {
    return html`<span class="spinner-wrap" role="status" aria-label=${this.label}>
      <span class=${`spinner-ring spinner-ring--${this.size} spinner-ring--${this.tone}`} aria-hidden="true"></span>
      <span class="sr-only">${this.label}</span>
    </span>`;
  }
}

/** 14. EmrSkeletonElement (`emr-skeleton`) */
export class EmrSkeletonElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1ExtraStyles];

  @property({ type: String }) variant: 'line' | 'rect' | 'circle' = 'line';
  @property({ type: Number }) lines = 1;
  @property({ type: String }) width = '';
  @property({ type: String }) height = '';
  @property({ type: String }) override ariaLabel: string | null = 'Loading content';

  override render() {
    const customStyle = [
      this.width ? `width: ${this.width};` : '',
      this.height ? `height: ${this.height};` : '',
    ].filter(Boolean).join(' ');

    if (this.variant !== 'line') {
      return html`<div role="status" aria-busy="true" aria-label=${this.ariaLabel || 'Loading content'}>
        <span class=${`skeleton-block skeleton-block--${this.variant}`} style=${customStyle} aria-hidden="true"></span>
      </div>`;
    }

    const lineCount = Math.max(1, Math.floor(this.lines || 1));
    return html`<div class="skeleton-stack" role="status" aria-busy="true" aria-label=${this.ariaLabel || 'Loading content'}>
      ${Array.from({ length: lineCount }, (_, idx) => {
        const lineStyle = customStyle || (lineCount > 1 && idx === lineCount - 1 ? 'width: 72%;' : '');
        return html`<span class="skeleton-block skeleton-block--line" style=${lineStyle} aria-hidden="true"></span>`;
      })}
    </div>`;
  }
}

function deriveAvatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

/** 15. EmrAvatarElement (`emr-avatar`) */
export class EmrAvatarElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1ExtraStyles];

  @property({ type: String }) name = '';
  @property({ type: String }) initials = '';
  @property({ type: String }) imageUrl: string | null = null;
  @property({ type: String }) size: 'sm' | 'md' | 'lg' = 'md';
  @property({ type: String }) tone: EmrTone = 'neutral';

  @state() private imageFailed = false;

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('imageUrl')) {
      this.imageFailed = false;
    }
  }

  override render() {
    const resolvedInitials = (this.initials || deriveAvatarInitials(this.name)).slice(0, 3);
    const accessibleName = this.name || resolvedInitials || 'Avatar';
    const showImage = !!this.imageUrl && !this.imageFailed;

    return html`<span
      part="avatar"
      role="img"
      aria-label=${accessibleName}
      class=${`avatar avatar--${this.size} emr-badge--${this.tone}`}
    >
      ${showImage
        ? html`<img
            src=${this.imageUrl!}
            alt=${this.name}
            @error=${() => {
              this.imageFailed = true;
            }}
          />`
        : resolvedInitials
          ? html`<span aria-hidden="true">${resolvedInitials}</span>`
          : renderEmrSvgIcon('user', this.size === 'lg' ? 22 : 16)}
    </span>`;
  }
}

/** 16. EmrFileTriggerElement (`emr-file-trigger`) */
export class EmrFileTriggerElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1ExtraStyles];

  private readonly fallbackId = nextL1ExtraId('emr-file-trigger');

  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: Boolean }) labelHidden = false;
  @property({ type: String }) buttonLabel = 'Choose files';
  @property({ type: String }) dropHint = 'or drag and drop files here';
  @property({ type: String }) accept = '';
  @property({ type: Boolean }) multiple = false;
  @property({ type: Boolean }) readOnly = false;
  @property({ type: Boolean }) disabled = false;
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';

  @state() private dragOver = false;

  private get locked(): boolean {
    return this.readOnly || this.disabled;
  }

  private emitFiles(fileList: FileList | readonly File[] | null | undefined): void {
    if (this.locked || !fileList) return;
    const files = Array.from(fileList);
    if (files.length === 0) return;
    const selected = this.multiple ? files : [files[0]!];
    const items: EmrFileSelectionItem[] = selected.map(f => ({
      name: f.name,
      sizeBytes: f.size,
      mimeType: f.type || 'application/octet-stream',
      lastModified: f.lastModified,
    }));
    this.dispatchEvent(
      new CustomEvent<readonly EmrFileSelectionItem[]>('filesSelected', {
        detail: items,
        bubbles: true,
        composed: true,
      }),
    );
    this.dispatchEvent(
      new CustomEvent<readonly File[]>('nativeFilesSelected', {
        detail: selected,
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    const id = this.controlId || this.fallbackId;
    const msgId = `${id}-message`;
    const zoneCls = [
      'drop-zone',
      this.dragOver ? 'drop-zone--over' : '',
      this.locked ? 'drop-zone--disabled' : '',
    ].filter(Boolean).join(' ');

    const triggerZone = html`<div
      class=${zoneCls}
      part="dropzone"
      @dragover=${(e: DragEvent) => {
        if (this.locked) return;
        e.preventDefault();
        this.dragOver = true;
      }}
      @dragleave=${() => {
        this.dragOver = false;
      }}
      @drop=${(e: DragEvent) => {
        e.preventDefault();
        this.dragOver = false;
        if (this.locked) return;
        this.emitFiles(e.dataTransfer?.files);
      }}
    >
      <input
        id=${id}
        class="sr-only"
        type="file"
        tabindex="-1"
        accept=${this.accept || nothing}
        ?multiple=${this.multiple}
        ?disabled=${this.locked}
        @change=${(e: Event) => {
          const input = e.target as HTMLInputElement;
          this.emitFiles(input.files);
          input.value = '';
        }}
      />
      <button
        type="button"
        class="emr-btn emr-btn--outline"
        aria-label=${this.label ? `${this.buttonLabel}, ${this.label}` : this.buttonLabel}
        ?disabled=${this.locked}
        @click=${() => {
          if (this.locked) return;
          this.shadowRoot?.querySelector<HTMLInputElement>('input[type="file"]')?.click();
        }}
      >
        ${renderEmrSvgIcon('upload', 16)}
        <span>${this.buttonLabel}</span>
      </button>
      ${this.dropHint ? html`<span class="emr-muted">${this.dropHint}</span>` : nothing}
    </div>`;

    if (this.labelHidden) return triggerZone;

    return html`<div class="emr-field" part="field">
      ${this.label ? html`<span class="emr-label">${this.label}</span>` : nothing}
      ${triggerZone}
      ${this.error
        ? html`<span id=${msgId} class="emr-error" role="alert">${this.error}</span>`
        : this.hint
          ? html`<span id=${msgId} class="emr-hint">${this.hint}</span>`
          : nothing}
    </div>`;
  }
}

export function registerL1ExtraElements(): void {
  defineEmrElement('emr-textarea', EmrTextareaElement);
  defineEmrElement('emr-icon-button', EmrIconButtonElement);
  defineEmrElement('emr-segmented-control', EmrSegmentedControlElement);
  defineEmrElement('emr-search-input', EmrSearchInputElement);
  defineEmrElement('emr-password-input', EmrPasswordInputElement);
  defineEmrElement('emr-numeric-stepper', EmrNumericStepperElement);
  defineEmrElement('emr-checkbox-group', EmrCheckboxGroupElement);
  defineEmrElement('emr-pagination', EmrPaginationElement);
  defineEmrElement('emr-dialog', EmrDialogElement);
  defineEmrElement('emr-popover', EmrPopoverElement);
  defineEmrElement('emr-tooltip', EmrTooltipElement);
  defineEmrElement('emr-progress-bar', EmrProgressBarElement);
  defineEmrElement('emr-spinner', EmrSpinnerElement);
  defineEmrElement('emr-skeleton', EmrSkeletonElement);
  defineEmrElement('emr-avatar', EmrAvatarElement);
  defineEmrElement('emr-file-trigger', EmrFileTriggerElement);
}
