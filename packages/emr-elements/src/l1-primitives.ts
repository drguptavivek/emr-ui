import { html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import type {
  EmrBadge,
  EmrOption,
  EmrStage,
  EmrStatTileModel,
  EmrTone,
} from '@drguptavivek/emr-controller';
import { EmrLitElement, defineEmrElement, emrShadowStyles } from './foundations.js';
import { renderEmrSvgIcon } from './icons.js';

const l1Styles = css`
  .stepper-wrap {
    display: inline-flex;
    align-items: center;
    width: 200px;
    max-width: 100%;
    height: var(--emr-control-height, 44px);
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius, 8px);
    background: var(--emr-surface, #fffefa);
    overflow: hidden;
  }
  .stepper-btn {
    width: 38px;
    height: 100%;
    border: 0;
    background: var(--emr-surface-soft, #f1f4f5);
    color: var(--emr-text, #263847);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .stepper-btn:hover:not(:disabled) {
    background: var(--emr-primary-hover, #d4e0e6);
  }
  .stepper-input {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: 0;
    background: transparent;
    color: var(--emr-text, #263847);
    text-align: center;
    font: inherit;
    font-variant-numeric: tabular-nums;
  }
  .date-wrap {
    display: inline-flex;
    align-items: center;
    width: 220px;
    max-width: 100%;
    height: var(--emr-control-height, 44px);
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius, 8px);
    background: var(--emr-surface, #fffefa);
    overflow: hidden;
  }
  .date-icon-box {
    width: 40px;
    height: 100%;
    border-left: 1px solid var(--emr-border, #c7d3da);
    background: var(--emr-surface-soft, #f1f4f5);
    color: var(--emr-text-muted, #5c6c78);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .option-grid {
    display: grid;
    grid-template-columns: repeat(var(--cols, auto-fit), minmax(140px, 1fr));
    gap: 8px;
  }
  .option-tile {
    min-height: var(--emr-control-height, 44px);
    padding: 0 12px;
    border: 1px solid var(--emr-border, #c7d3da);
    border-radius: var(--emr-radius, 8px);
    background: var(--emr-surface, #fffefa);
    color: var(--emr-text, #263847);
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font: inherit;
    font-size: var(--emr-text-md, 0.875rem);
    font-weight: var(--emr-weight-medium, 500);
    text-align: left;
  }
  .option-tile[aria-checked="true"],
  .option-tile[aria-pressed="true"] {
    border-color: var(--emr-primary, #475f70);
    background: var(--emr-primary-soft, #e3ebef);
    color: var(--emr-primary-contrast, #344b5a);
  }
  .indicator {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    border: 1.5px solid var(--emr-border, #c7d3da);
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .indicator--radio {
    border-radius: 999px;
  }
  .option-tile[aria-checked="true"] .indicator,
  .option-tile[aria-pressed="true"] .indicator {
    border-color: var(--emr-primary, #475f70);
    background: var(--emr-primary, #475f70);
    color: #fff;
  }
  .tabs-bar {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    border-bottom: 1px solid var(--emr-border, #c7d3da);
    padding-bottom: 6px;
  }
  .vas-track {
    width: 100%;
    accent-color: var(--emr-primary, #475f70);
  }
  .columns-grid {
    display: grid;
    grid-template-columns: repeat(var(--emr-cols, 2), minmax(0, 1fr));
    gap: 12px;
    align-items: start;
  }
`;

export class EmrButtonElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) label = '';
  @property({ type: String }) variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' = 'primary';
  @property({ type: Boolean }) disabled = false;

  override render() {
    const cls = this.variant === 'primary' ? 'emr-btn' : `emr-btn emr-btn--${this.variant}`;
    return html`<button type="button" part="button" class=${cls} ?disabled=${this.disabled} @click=${() => this.dispatchEvent(new CustomEvent('clicked', { bubbles: true, composed: true }))}>
      ${this.label}<slot></slot>
    </button>`;
  }
}

export class EmrTextInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: String }) value: string | null = '';
  @property({ type: String }) placeholder = '';
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';
  @property({ type: Boolean }) readOnly = false;

  override render() {
    return html`<div class="emr-field" part="field">
      ${this.label ? html`<label class="emr-label" for=${this.controlId}>${this.label}</label>` : nothing}
      <input
        id=${this.controlId}
        part="control"
        class="emr-control"
        type="text"
        .value=${this.value ?? ''}
        placeholder=${this.placeholder}
        ?readonly=${this.readOnly}
        @input=${(e: Event) => {
          const v = (e.target as HTMLInputElement).value;
          this.value = v;
          this.emitValueChange(v || null);
        }}
      />
      ${this.error ? html`<span class="emr-error">${this.error}</span>` : this.hint ? html`<span class="emr-hint">${this.hint}</span>` : nothing}
    </div>`;
  }
}

export class EmrNumberInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: Number }) value: number | null = null;
  @property({ type: Number }) min?: number;
  @property({ type: Number }) max?: number;
  @property({ type: Number }) step = 1;
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';
  @property({ type: Boolean }) readOnly = false;

  private stepBy(dir: -1 | 1): void {
    if (this.readOnly) return;
    const base = this.value ?? 0;
    let next = Math.round((base + dir * (this.step || 1)) * 10000) / 10000;
    if (this.min !== undefined && next < this.min) next = this.min;
    if (this.max !== undefined && next > this.max) next = this.max;
    this.value = next;
    this.emitValueChange(next);
  }

  override render() {
    return html`<div class="emr-field" part="field">
      ${this.label ? html`<label class="emr-label" for=${this.controlId}>${this.label}</label>` : nothing}
      <div class="stepper-wrap" part="stepper">
        ${!this.readOnly
          ? html`<button type="button" class="stepper-btn" aria-label="Decrease value" @click=${() => this.stepBy(-1)}>${renderEmrSvgIcon('minus', 15)}</button>`
          : nothing}
        <input
          id=${this.controlId}
          part="control"
          class="stepper-input"
          type="text"
          inputmode="decimal"
          .value=${this.value === null || this.value === undefined ? '' : String(this.value)}
          ?readonly=${this.readOnly}
          @input=${(e: Event) => {
            const raw = (e.target as HTMLInputElement).value.trim();
            const parsed = raw === '' ? null : Number(raw);
            if (parsed === null || Number.isFinite(parsed)) {
              this.value = parsed;
              this.emitValueChange(parsed);
            }
          }}
        />
        ${!this.readOnly
          ? html`<button type="button" class="stepper-btn" aria-label="Increase value" @click=${() => this.stepBy(1)}>${renderEmrSvgIcon('plus', 15)}</button>`
          : nothing}
      </div>
      ${this.error ? html`<span class="emr-error">${this.error}</span>` : this.hint ? html`<span class="emr-hint">${this.hint}</span>` : nothing}
    </div>`;
  }
}

export class EmrDateInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: String }) value: string | null = null;
  @property({ type: String }) precision: 'day' | 'month' | 'year' = 'day';
  @property({ type: String }) hint = '';
  @property({ type: String }) error = '';
  @property({ type: Boolean }) readOnly = false;

  override render() {
    const inputType = this.precision === 'month' ? 'month' : this.precision === 'year' ? 'number' : 'date';
    return html`<div class="emr-field" part="field">
      ${this.label ? html`<label class="emr-label" for=${this.controlId}>${this.label}</label>` : nothing}
      <div class="date-wrap" part="control">
        <input
          id=${this.controlId}
          class="stepper-input"
          type=${inputType}
          placeholder=${this.precision === 'year' ? 'YYYY' : this.precision === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD'}
          .value=${this.value ?? ''}
          ?readonly=${this.readOnly}
          @input=${(e: Event) => {
            const v = (e.target as HTMLInputElement).value || null;
            this.value = v;
            this.emitValueChange(v);
          }}
        />
        <span class="date-icon-box">${renderEmrSvgIcon('calendar', 16)}</span>
      </div>
      ${this.error ? html`<span class="emr-error">${this.error}</span>` : this.hint ? html`<span class="emr-hint">${this.hint}</span>` : nothing}
    </div>`;
  }
}

export class EmrTimeInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: String }) value: string | null = null;
  @property({ type: String }) precision: 'minute' | 'second' = 'minute';
  @property({ type: Boolean }) readOnly = false;

  override render() {
    return html`<div class="emr-field" part="field">
      ${this.label ? html`<label class="emr-label" for=${this.controlId}>${this.label}</label>` : nothing}
      <div class="date-wrap" style="width: 170px;" part="control">
        <input
          id=${this.controlId}
          class="stepper-input"
          type="time"
          step=${this.precision === 'second' ? '1' : '60'}
          .value=${this.value ?? ''}
          ?readonly=${this.readOnly}
          @input=${(e: Event) => {
            const v = (e.target as HTMLInputElement).value || null;
            this.value = v;
            this.emitValueChange(v);
          }}
        />
        <span class="date-icon-box">${renderEmrSvgIcon('clock', 16)}</span>
      </div>
    </div>`;
  }
}

export class EmrDateTimeInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) controlId = '';
  @property({ type: String }) label = '';
  @property({ type: String }) value: string | null = null;
  @property({ type: String }) precision: 'minute' | 'second' = 'minute';
  @property({ type: Boolean }) readOnly = false;

  override render() {
    return html`<div class="emr-field" part="field">
      ${this.label ? html`<label class="emr-label" for=${this.controlId}>${this.label}</label>` : nothing}
      <input
        id=${this.controlId}
        class="emr-control"
        style="max-width: 280px;"
        type="datetime-local"
        step=${this.precision === 'second' ? '1' : '60'}
        .value=${(this.value ?? '').replace(/Z$/, '')}
        ?readonly=${this.readOnly}
        @input=${(e: Event) => {
          const v = (e.target as HTMLInputElement).value || null;
          this.value = v;
          this.emitValueChange(v);
        }}
      />
    </div>`;
  }
}

export class EmrSelectElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) label = '';
  @property({ type: String }) value: string | null = null;
  @property({ attribute: false }) options: readonly EmrOption[] = [];
  @property({ type: Boolean }) readOnly = false;

  override render() {
    return html`<div class="emr-field" part="field">
      ${this.label ? html`<span class="emr-label">${this.label}</span>` : nothing}
      <div class="option-grid">
        ${this.options.map((opt) => {
          const sel = this.value === opt.value;
          return html`<button
            type="button"
            class="option-tile"
            aria-pressed=${sel}
            ?disabled=${this.readOnly || opt.disabled}
            @click=${() => {
              const next = sel ? null : String(opt.value);
              this.value = next;
              this.emitValueChange(next);
            }}
          >
            <span class="indicator indicator--radio">${sel ? renderEmrSvgIcon('check', 11) : nothing}</span>
            <span>${opt.label}</span>
          </button>`;
        })}
      </div>
    </div>`;
  }
}

export class EmrQuantityInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) label = '';
  @property({ type: Number }) value: number | null = null;
  @property({ type: String }) unit: string | null = null;
  @property({ attribute: false }) units: readonly EmrOption[] = [];
  @property({ type: Boolean }) readOnly = false;

  override render() {
    return html`<div class="emr-field">
      ${this.label ? html`<span class="emr-label">${this.label}</span>` : nothing}
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <emr-number-input
          .value=${this.value}
          .readOnly=${this.readOnly}
          @valueChange=${(e: CustomEvent<number | null>) => {
            this.value = e.detail;
            this.emitValueChange(e.detail);
          }}
        ></emr-number-input>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${this.units.map(
            (u) => html`<button
              type="button"
              class="option-tile"
              style="min-width:64px;"
              aria-pressed=${this.unit === u.value}
              ?disabled=${this.readOnly}
              @click=${() => {
                this.unit = String(u.value);
                this.dispatchEvent(new CustomEvent('unitChange', { detail: this.unit, bubbles: true, composed: true }));
              }}
            >${u.label}</button>`,
          )}
        </div>
      </div>
    </div>`;
  }
}

export class EmrPairedInputElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) label = '';
  @property({ type: String }) firstValue: string | null = '';
  @property({ type: String }) secondValue: string | null = '';
  @property({ type: String }) separator = '/';
  @property({ type: Boolean }) readOnly = false;

  override render() {
    return html`<div class="emr-field">
      ${this.label ? html`<span class="emr-label">${this.label}</span>` : nothing}
      <div style="display:inline-flex;align-items:center;gap:8px;">
        <input class="emr-control" style="width:132px;" .value=${this.firstValue ?? ''} ?readonly=${this.readOnly}
          @input=${(e: Event) => {
            this.firstValue = (e.target as HTMLInputElement).value || null;
            this.dispatchEvent(new CustomEvent('firstValueChange', { detail: this.firstValue, bubbles: true, composed: true }));
          }} />
        <span class="emr-muted">${this.separator}</span>
        <input class="emr-control" style="width:132px;" .value=${this.secondValue ?? ''} ?readonly=${this.readOnly}
          @input=${(e: Event) => {
            this.secondValue = (e.target as HTMLInputElement).value || null;
            this.dispatchEvent(new CustomEvent('secondValueChange', { detail: this.secondValue, bubbles: true, composed: true }));
          }} />
      </div>
    </div>`;
  }
}

export class EmrCheckboxElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) label = '';
  @property({ type: Boolean }) checked = false;
  @property({ type: Boolean }) readOnly = false;

  override render() {
    return html`<button
      type="button"
      role="checkbox"
      class="option-tile"
      aria-checked=${this.checked}
      ?disabled=${this.readOnly}
      @click=${() => {
        if (this.readOnly) return;
        this.checked = !this.checked;
        this.dispatchEvent(new CustomEvent('checkedChange', { detail: this.checked, bubbles: true, composed: true }));
        this.emitValueChange(this.checked);
      }}
    >
      <span class="indicator">${this.checked ? renderEmrSvgIcon('check', 11) : nothing}</span>
      <span>${this.label}<slot></slot></span>
    </button>`;
  }
}

export class EmrToggleElement extends EmrCheckboxElement {}

export class EmrRadioGroupElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) label = '';
  @property({ type: String }) value: string | null = null;
  @property({ attribute: false }) options: readonly EmrOption[] = [];
  @property({ type: String }) orientation: 'horizontal' | 'vertical' = 'horizontal';
  @property({ type: Boolean }) readOnly = false;

  override render() {
    return html`<div class="emr-field" role="radiogroup" aria-label=${this.label}>
      ${this.label ? html`<span class="emr-label">${this.label}</span>` : nothing}
      <div class="option-grid" style=${this.orientation === 'vertical' ? '--cols: 1;' : ''}>
        ${this.options.map((opt) => {
          const sel = this.value === opt.value;
          return html`<button
            type="button"
            role="radio"
            class="option-tile"
            aria-checked=${sel}
            ?disabled=${this.readOnly || opt.disabled}
            @click=${() => {
              this.value = String(opt.value);
              this.emitValueChange(this.value);
            }}
          >
            <span class="indicator indicator--radio">${sel ? renderEmrSvgIcon('check', 11) : nothing}</span>
            <span>${opt.label}</span>
          </button>`;
        })}
      </div>
    </div>`;
  }
}

export class EmrBadgeElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) tone: EmrTone = 'neutral';
  @property({ type: String }) label = '';
  @property({ attribute: false }) badge?: EmrBadge;

  override render() {
    const tone = this.badge?.tone ?? this.tone;
    const text = this.badge?.label ?? this.label;
    return html`<span part="badge" class="emr-badge emr-badge--${tone}">${text}<slot></slot></span>`;
  }
}

export class EmrChipElement extends EmrBadgeElement {}

export class EmrAlertElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) tone: EmrTone = 'info';
  @property({ type: String }) override title = '';

  override render() {
    return html`<div role="status" class="emr-card emr-badge--${this.tone}" style="border-radius:var(--emr-radius, 8px);padding:12px;">
      ${this.title ? html`<strong style="display:block;">${this.title}</strong>` : nothing}
      <div><slot></slot></div>
    </div>`;
  }
}

export class EmrStateMessageElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) override title = '';
  @property({ type: String }) description = '';
  @property({ type: String }) state: 'empty' | 'loading' | 'error' = 'empty';

  override render() {
    return html`<div class="emr-card" style="text-align:center;">
      <p class="emr-title">${this.title || this.state}</p>
      ${this.description ? html`<p class="emr-muted">${this.description}</p>` : nothing}
      <slot></slot>
    </div>`;
  }
}

export class EmrSearchSelectElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) label = '';
  @property({ type: String }) query = '';
  @property({ attribute: false }) options: readonly EmrOption[] = [];

  override render() {
    return html`<div class="emr-field">
      ${this.label ? html`<span class="emr-label">${this.label}</span>` : nothing}
      <input class="emr-control" type="search" .value=${this.query} placeholder="Search…"
        @input=${(e: Event) => {
          this.query = (e.target as HTMLInputElement).value;
          this.dispatchEvent(new CustomEvent('queryChange', { detail: this.query, bubbles: true, composed: true }));
        }} />
      <div class="option-grid">
        ${this.options.map((o) => html`<button type="button" class="option-tile" @click=${() => this.emitValueChange(o.value)}>${o.label}</button>`)}
      </div>
    </div>`;
  }
}

export class EmrTabsElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ attribute: false }) tabs: readonly EmrOption[] = [];
  @property({ type: String }) activeTab: string | null = null;

  override render() {
    return html`<div role="tablist" class="tabs-bar">
      ${this.tabs.map((tab) => {
        const active = this.activeTab === tab.value;
        return html`<button
          type="button"
          role="tab"
          class="option-tile"
          aria-selected=${active}
          aria-pressed=${active}
          @click=${() => {
            this.activeTab = String(tab.value);
            this.dispatchEvent(new CustomEvent('tabChange', { detail: this.activeTab, bubbles: true, composed: true }));
            this.emitValueChange(this.activeTab);
          }}
        >${tab.label}</button>`;
      })}
    </div>`;
  }
}

export class EmrSeparatorElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) label = '';

  override render() {
    return html`<div role="separator" style="display:flex;align-items:center;gap:8px;margin:8px 0;">
      <div style="flex:1;height:1px;background:var(--emr-border,#c7d3da);"></div>
      ${this.label ? html`<span class="emr-muted">${this.label}</span>` : nothing}
      <div style="flex:1;height:1px;background:var(--emr-border,#c7d3da);"></div>
    </div>`;
  }
}

export class EmrLikertElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) label = '';
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 10;
  @property({ type: Number }) value: number | null = null;

  override render() {
    const pts: number[] = [];
    for (let i = this.min; i <= this.max; i++) pts.push(i);
    return html`<div class="emr-field">
      ${this.label ? html`<span class="emr-label">${this.label}</span>` : nothing}
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        ${pts.map(
          (n) => html`<button
            type="button"
            class="option-tile"
            style="min-width:44px;justify-content:center;"
            aria-pressed=${this.value === n}
            @click=${() => {
              this.value = n;
              this.emitValueChange(n);
            }}
          >${n}</button>`,
        )}
      </div>
    </div>`;
  }
}

export class EmrVasElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) label = '';
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 10;
  @property({ type: Number }) step = 0.1;
  @property({ type: Number }) value: number | null = null;

  override render() {
    return html`<div class="emr-field">
      <div class="emr-header">
        ${this.label ? html`<span class="emr-label">${this.label}</span>` : nothing}
        <span class="emr-badge emr-badge--info">${this.value ?? 'Unmarked'} / ${this.max}</span>
      </div>
      <input
        type="range"
        class="vas-track"
        min=${this.min}
        max=${this.max}
        step=${this.step}
        .value=${String(this.value ?? this.min)}
        @input=${(e: Event) => {
          const n = Number((e.target as HTMLInputElement).value);
          this.value = n;
          this.emitValueChange(n);
        }}
      />
    </div>`;
  }
}

export class EmrCardElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) override title = '';

  override render() {
    return html`<section class="emr-card" part="card">
      ${this.title ? html`<h3 class="emr-title">${this.title}</h3>` : nothing}
      <slot></slot>
    </section>`;
  }
}

export class EmrColumnsElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: Number }) columns = 2;

  override render() {
    const c = Math.max(1, Math.min(6, this.columns || 2));
    return html`<div class="columns-grid" style="--emr-cols: ${c};"><slot></slot></div>`;
  }
}

export class EmrFieldValueRowElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ type: String }) field = '';
  @property({ type: String }) value = '';
  @property({ type: String }) remarks = '';
  @property({ type: String }) notes = '';

  override render() {
    return html`<div class="columns-grid" style="--emr-cols: 4; padding: 8px 0; border-bottom: 1px solid var(--emr-border,#c7d3da);">
      <strong>${this.field}</strong>
      <span>${this.value}</span>
      <span class="emr-muted">${this.remarks}</span>
      <span class="emr-muted">${this.notes}</span>
    </div>`;
  }
}

export class EmrStatusCellElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ attribute: false }) badge?: EmrBadge;
  @property({ type: String }) value = '';
  @property({ type: String }) attribution = '';

  override render() {
    return html`<div class="emr-card" style="padding:10px;">
      ${this.badge ? html`<emr-badge .badge=${this.badge}></emr-badge>` : nothing}
      ${this.value ? html`<strong>${this.value}</strong>` : nothing}
      ${this.attribution ? html`<span class="emr-muted">${this.attribution}</span>` : nothing}
    </div>`;
  }
}

export class EmrStageStepperElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ attribute: false }) steps: readonly EmrStage[] = [];
  @property({ type: String }) activeStepId = '';

  override render() {
    return html`<ol style="display:flex;gap:8px;flex-wrap:wrap;list-style:none;padding:0;margin:0;">
      ${this.steps.map(
        (s, idx) => html`<li>
          <button
            type="button"
            class="option-tile"
            aria-current=${s.id === this.activeStepId ? 'step' : 'false'}
            aria-pressed=${s.id === this.activeStepId}
            @click=${() => this.dispatchEvent(new CustomEvent('stepSelected', { detail: s.id, bubbles: true, composed: true }))}
          >
            <strong>${idx + 1}.</strong> <span>${s.label}</span>
          </button>
        </li>`,
      )}
    </ol>`;
  }
}

export class EmrStatTileElement extends EmrLitElement {
  static override styles = [emrShadowStyles, l1Styles];
  @property({ attribute: false }) model?: EmrStatTileModel;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    return html`<div class="emr-card" @click=${() => this.dispatchEvent(new CustomEvent('statSelected', { detail: m.label, bubbles: true, composed: true }))}>
      <span class="emr-muted">${m.label}</span>
      <strong style="font-size:var(--emr-text-2xl,1.5rem);">${m.value}</strong>
    </div>`;
  }
}

export function registerL1Elements(): void {
  defineEmrElement('emr-button', EmrButtonElement);
  defineEmrElement('emr-text-input', EmrTextInputElement);
  defineEmrElement('emr-number-input', EmrNumberInputElement);
  defineEmrElement('emr-date-input', EmrDateInputElement);
  defineEmrElement('emr-time-input', EmrTimeInputElement);
  defineEmrElement('emr-datetime-input', EmrDateTimeInputElement);
  defineEmrElement('emr-select', EmrSelectElement);
  defineEmrElement('emr-quantity-input', EmrQuantityInputElement);
  defineEmrElement('emr-paired-input', EmrPairedInputElement);
  defineEmrElement('emr-checkbox', EmrCheckboxElement);
  defineEmrElement('emr-toggle', EmrToggleElement);
  defineEmrElement('emr-radio-group', EmrRadioGroupElement);
  defineEmrElement('emr-badge', EmrBadgeElement);
  defineEmrElement('emr-chip', EmrChipElement);
  defineEmrElement('emr-alert', EmrAlertElement);
  defineEmrElement('emr-state-message', EmrStateMessageElement);
  defineEmrElement('emr-search-select', EmrSearchSelectElement);
  defineEmrElement('emr-tabs', EmrTabsElement);
  defineEmrElement('emr-separator', EmrSeparatorElement);
  defineEmrElement('emr-likert', EmrLikertElement);
  defineEmrElement('emr-vas', EmrVasElement);
  defineEmrElement('emr-card', EmrCardElement);
  defineEmrElement('emr-columns', EmrColumnsElement);
  defineEmrElement('emr-field-value-row', EmrFieldValueRowElement);
  defineEmrElement('emr-status-cell', EmrStatusCellElement);
  defineEmrElement('emr-stage-stepper', EmrStageStepperElement);
  defineEmrElement('emr-stat-tile', EmrStatTileElement);
}
