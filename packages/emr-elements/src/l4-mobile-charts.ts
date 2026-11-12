import { css, html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import type {
  EmrBarChartModel, EmrBottomTabBarIntent, EmrBottomTabItem, EmrChartIntent, EmrFunnelChartModel,
  EmrLoginFormIntent, EmrLoginFormModel, EmrPinPadIntent, EmrPinPadModel,
  EmrSheetIntent, EmrSyncPillIntent, EmrSyncPillModel,
  EmrTopBarIntent, EmrTopBarModel,
} from '@drguptavivek/emr-controller';
import { EmrModelElement } from './controlled-rendering.js';
import { defineEmrElement, EmrLitElement, emrShadowStyles } from './foundations.js';
import { EmrToastElement } from './l1-primitives.js';

export { EmrToastElement };

const chartStyles = css`
  .plot { display: grid; gap: 6px; }
  .track { display: block; inline-size: 100%; background: var(--emr-surface-soft); }
  .bar { display: block; min-block-size: 8px; background: var(--emr-primary); }
  .columns { display: flex; gap: 8px; overflow: auto; }
  .columns .track { display: flex; align-items: end; block-size: 120px; }
  .columns .bar { inline-size: 100%; min-block-size: 0; }
  .chart-action { display: grid; gap: 6px; min-inline-size: 80px; text-align: start; }
`;

export class EmrBarChartElement extends EmrModelElement<EmrBarChartModel, EmrChartIntent> {
  static override styles = [...EmrModelElement.styles, chartStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const values = m.series.flatMap((series) => m.categories.map((category) => series.values[category.id]));
    const maximum = Math.max(1, m.maxValue ?? 0, ...values.filter((value): value is number => Number.isFinite(value)));
    const vertical = m.orientation === 'vertical';
    return this.panel(m.title, html`
      ${m.description ? html`<p class="emr-muted">${m.description}</p>` : nothing}
      ${m.yAxisLabel ? html`<p>${m.yAxisLabel}</p>` : nothing}
      ${!m.categories.length || !m.series.length ? html`<p>No chart data.</p>` : html`
        <div class=${vertical ? 'columns' : 'plot'}>
          ${m.categories.flatMap((category) => m.series.map((series) => {
            const value = series.values[category.id];
            const hasValue = typeof value === 'number' && Number.isFinite(value) && value >= 0;
            const label = hasValue ? series.valueLabels?.[category.id] ?? String(value) : 'No data';
            const length = hasValue ? value / maximum * 100 : 0;
            return html`<button type="button" class="emr-btn emr-btn--ghost chart-action"
              @click=${() => this.send({ type: 'categorySelected', categoryId: category.id, seriesId: series.id })}>
              <span>${category.label} · ${series.label}: ${label}</span>
              ${hasValue ? html`<span class="track" aria-hidden="true">
                <span class="bar" style=${vertical ? `height:${length}%` : `width:${length}%`}></span>
              </span>` : nothing}
            </button>`;
          }))}
        </div>
      `}
    `);
  }
}

export class EmrFunnelChartElement extends EmrModelElement<EmrFunnelChartModel, EmrChartIntent> {
  static override styles = [...EmrModelElement.styles, chartStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const max = Math.max(1, ...m.steps.map((step) => step.value).filter(Number.isFinite));
    return this.panel(m.title, html`
      ${m.description ? html`<p class="emr-muted">${m.description}</p>` : nothing}
      ${!m.steps.length ? html`<p>No funnel data.</p>` : nothing}
      <div class="plot">
        ${m.steps.map((step) => {
          const length = Number.isFinite(step.value) ? Math.max(0, step.value / max * 100) : 0;
          return html`<button type="button" class="emr-btn emr-btn--ghost chart-action"
            @click=${() => this.send({ type: 'stepSelected', stepId: step.id })}>
            <span>${step.label}: ${step.valueLabel}${step.conversionLabel ? ` · ${step.conversionLabel}` : ''}</span>
            <span class="track" aria-hidden="true"><span class="bar" style=${`width:${length}%`}></span></span>
          </button>`;
        })}
      </div>
    `);
  }
}

export class EmrPinPadElement extends EmrModelElement<EmrPinPadModel, EmrPinPadIntent> {
  static override styles = [...EmrModelElement.styles, css`
    .keypad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; max-inline-size: 260px; }
    .dots { letter-spacing: 0.3em; }
  `];
  @property({ type: Boolean }) showForgot = false;

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Delete', '0', 'Submit'];
    const keypadEnabled = () => !!this.model && !this.model.locked;
    return this.panel(m.title, html`
      ${m.prompt ? html`<p>${m.prompt}</p>` : nothing}
      <div class="dots" role="img" aria-label=${`${m.digitsEntered} of ${m.length} digits entered`}>
        ${Array.from({ length: m.length }, (_, index) => index < m.digitsEntered ? '●' : '○').join('')}
      </div>
      ${m.error ? html`<p class="emr-error" role="alert">${m.error}</p>` : nothing}
      ${m.locked && m.lockoutMessage ? html`<p role="alert">${m.lockoutMessage}</p>` : nothing}
      <div class="keypad">
        ${keys.map((key) => this.action(key,
          key === 'Delete' ? { type: 'deleted' } : key === 'Submit' ? { type: 'submitted' } : { type: 'digitPressed', digit: key },
          keypadEnabled))}
      </div>
      <div class="emr-actions">
        ${m.biometric?.available ? this.action(m.biometric.label, { type: 'biometricRequested' }, () => !!this.model?.biometric?.available) : nothing}
        ${this.showForgot ? this.action('Forgot PIN?', { type: 'forgotRequested' }, () => this.showForgot) : nothing}
      </div>
    `);
  }
}

export class EmrLoginFormElement extends EmrModelElement<EmrLoginFormModel, EmrLoginFormIntent> {
  private submit(event: SubmitEvent): void {
    event.preventDefault();
    const m = this.model;
    if (!m || m.busy) return;
    const passwordInput = (event.currentTarget as HTMLFormElement).elements.namedItem('password') as HTMLInputElement;
    const password = passwordInput.value;
    passwordInput.value = '';
    this.send({ type: 'submitRequested', username: m.username, password });
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    return this.panel(m.title ?? 'Sign in', html`
      <form class="emr-stack" @submit=${this.submit}>
        <label class="emr-field">${m.usernameLabel}
          <input class="emr-control" autocomplete="username" .value=${live(m.username)}
            ?readonly=${!!m.busy} @input=${(event: Event) => {
              if (this.model && !this.model.busy) this.send({ type: 'usernameChanged', value: (event.target as HTMLInputElement).value });
            }}>
        </label>
        <label class="emr-field">${m.passwordLabel}
          <input class="emr-control" type="password" name="password" autocomplete="current-password" ?readonly=${!!m.busy}>
        </label>
        ${m.error ? html`<p class="emr-error" role="alert">${m.error}</p>` : nothing}
        <button type="submit" class="emr-btn" aria-disabled=${!!m.busy}>${m.busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    `);
  }
}

export class EmrBottomTabBarElement extends EmrLitElement {
  @property({ attribute: false }) items: readonly EmrBottomTabItem[] = [];
  @property({ type: String }) activeId = '';

  override render() {
    const split = Math.ceil(this.items.length / 2);
    const tab = (item: EmrBottomTabItem) => html`<button type="button" class="emr-btn emr-btn--ghost"
      aria-current=${item.id === this.activeId ? 'page' : nothing}
      @click=${() => this.emitIntent<EmrBottomTabBarIntent>({ type: 'tabSelected', id: item.id })}>
      ${item.label}${item.badge ? html`<emr-badge .badge=${item.badge}></emr-badge>` : nothing}
    </button>`;
    return html`<nav class="emr-card" aria-label="Main navigation" style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;">
      ${this.items.slice(0, split).map(tab)}
      <button type="button" class="emr-btn" @click=${() => this.emitIntent<EmrBottomTabBarIntent>({ type: 'scanRequested' })}>Scan</button>
      ${this.items.slice(split).map(tab)}
    </nav>`;
  }
}

export class EmrSyncPillElement extends EmrModelElement<EmrSyncPillModel, EmrSyncPillIntent> {
  @property({ type: Boolean }) interactive = false;
  override render() {
    const m = this.model;
    if (!m) return nothing;
    const badge = html`<emr-badge .badge=${m}></emr-badge>`;
    return this.interactive
      ? html`<button type="button" class="emr-btn emr-btn--ghost" aria-label=${[m.label, m.detail, 'Sync details'].filter(Boolean).join(', ')}
          @click=${() => { if (this.interactive) this.send({ type: 'syncDetailsRequested' }); }}>${badge}</button>`
      : html`<span role="status" aria-label=${[m.label, m.detail].filter(Boolean).join(', ')}>${badge}</span>`;
  }
}

export class EmrSheetElement extends EmrLitElement {
  static override styles = [emrShadowStyles, css`
    dialog { inset: 0 0 0 auto; margin: 0; box-sizing: border-box; max-inline-size: 100%; inline-size: 480px; block-size: 100%; max-block-size: 100%; color: var(--emr-text); background: var(--emr-surface); border: 1px solid var(--emr-border); }
    dialog::backdrop { background: var(--emr-backdrop); }
    @media (max-width: 720px) {
      dialog { inset: auto 0 0; inline-size: 100%; block-size: auto; max-block-size: 90%; }
    }
  `];
  @property({ type: Boolean }) open = false;
  @property({ type: String }) override title = '';
  @property({ type: Boolean }) showBack = false;

  protected override updated(): void {
    const dialog = this.renderRoot.querySelector('dialog')!;
    if (this.open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } else if (!this.open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  }

  private closeRequested(): void {
    if (this.open) this.emitIntent<EmrSheetIntent>({ type: 'closeRequested' });
  }

  override render() {
    return html`<dialog aria-label=${this.title || 'Panel'} @cancel=${(event: Event) => {
      event.preventDefault();
      this.closeRequested();
    }}>
      <header class="emr-header">
        ${this.showBack ? html`<button type="button" class="emr-btn emr-btn--ghost"
          @click=${() => { if (this.open && this.showBack) this.emitIntent<EmrSheetIntent>({ type: 'backRequested' }); }}>Back</button>` : nothing}
        <h3 class="emr-title">${this.title}</h3>
        <button type="button" class="emr-btn emr-btn--ghost" @click=${this.closeRequested}>Close</button>
      </header>
      <slot></slot>
      <slot name="footer"></slot>
    </dialog>`;
  }
}

type SearchModel = EmrTopBarModel['search'];
let searchSequence = 0;

export class EmrTopBarSearchElement extends EmrModelElement<SearchModel, EmrTopBarIntent> {
  static override styles = [...EmrModelElement.styles, css`
    .results { max-block-size: 320px; overflow: auto; }
    .result { text-align: start; inline-size: 100%; }
  `];
  private readonly listId = `emr-search-${++searchSequence}`;
  @state() private activeIndex = -1;

  protected override willUpdate(changed: PropertyValues<this>): void {
    const previous = changed.get('model');
    if (changed.has('model') && (previous?.query !== this.model?.query || previous?.groups !== this.model?.groups || !this.model?.open)) {
      this.activeIndex = -1;
    }
  }

  private get results() {
    return this.model?.groups.flatMap((group) => group.results.map((result) => ({ groupId: group.id, result }))) ?? [];
  }

  private select(groupId: string, id: string): void {
    if (this.model?.open && this.results.some((entry) => entry.groupId === groupId && entry.result.id === id)) {
      this.send({ type: 'resultSelected', groupId, id });
    }
  }

  private keydown(event: KeyboardEvent): void {
    const m = this.model;
    if (!m) return;
    if (event.key === 'Escape' && m.open) {
      event.preventDefault();
      this.send({ type: 'searchCloseRequested' });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const active = this.results[this.activeIndex];
      if (active && m.open) this.select(active.groupId, active.result.id);
      else this.send({ type: 'queryChanged', query: (event.target as HTMLInputElement).value });
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!m.open) {
        this.send({ type: 'searchOpenRequested' });
        return;
      }
      const count = this.results.length;
      if (!count) return;
      if (this.activeIndex < 0) this.activeIndex = event.key === 'ArrowDown' ? 0 : count - 1;
      else this.activeIndex = (this.activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + count) % count;
    }
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    let index = 0;
    return html`<div class="emr-stack" @focusout=${(event: FocusEvent) => {
      const container = event.currentTarget as HTMLElement;
      if (this.model?.open && !container.contains(event.relatedTarget as Node | null)) this.send({ type: 'searchCloseRequested' });
    }}>
      <div class="emr-actions">
        <input class="emr-control" type="search" role="combobox" aria-label="Search" aria-autocomplete="list"
          aria-expanded=${m.open} aria-controls=${this.listId}
          aria-activedescendant=${m.open && this.activeIndex >= 0 ? `${this.listId}-${this.activeIndex}` : nothing}
          .value=${live(m.query)} @focus=${() => {
            if (this.model && !this.model.open) this.send({ type: 'searchOpenRequested' });
          }}
          @input=${(event: Event) => this.send({ type: 'queryChanged', query: (event.target as HTMLInputElement).value })}
          @keydown=${this.keydown}>
        ${this.action('Search', { type: 'queryChanged', query: m.query }, () => !!this.model && !this.model.loading)}
      </div>
      ${m.open ? html`<div class="results emr-card" id=${this.listId} role="listbox" aria-label="Search results" aria-busy=${!!m.loading}>
        ${m.loading ? html`<p role="status">Searching…</p>` : nothing}
        ${!m.loading && !this.results.length ? html`<p>No results.</p>` : nothing}
        ${m.groups.filter((group) => group.results.length).map((group) => html`<div role="group" aria-label=${group.label}>
          <strong>${group.label}</strong>
          ${group.results.map((result) => {
            const at = index++;
            return html`<button type="button" class="emr-btn emr-btn--ghost result" role="option"
              id=${`${this.listId}-${at}`} aria-selected=${this.activeIndex === at}
              @click=${() => this.select(group.id, result.id)}>
              ${result.label}${result.sub ? html` <small>${result.sub}</small>` : nothing}
              ${result.badge ? html`<emr-badge .badge=${result.badge}></emr-badge>` : nothing}
            </button>`;
          })}
        </div>`)}
      </div>` : nothing}
    </div>`;
  }
}

export class EmrTopBarElement extends EmrModelElement<EmrTopBarModel, EmrTopBarIntent> {
  override render() {
    const m = this.model;
    if (!m) return nothing;
    return html`<header class="emr-card emr-actions">
      ${m.showNavToggle ? this.action('Open navigation', { type: 'navToggleRequested' }, () => !!this.model?.showNavToggle) : nothing}
      <slot name="title"><strong>${m.title}</strong></slot>
      <emr-top-bar-search .model=${m.search} @intent=${(event: CustomEvent<EmrTopBarIntent>) => {
        event.stopPropagation();
        this.send(event.detail);
      }}></emr-top-bar-search>
      ${this.action(m.userLabel ?? 'User menu', { type: 'menuRequested' })}
    </header>`;
  }
}

export function registerL4MobileChartsElements(): void {
  defineEmrElement('emr-bar-chart', EmrBarChartElement);
  defineEmrElement('emr-funnel-chart', EmrFunnelChartElement);
  defineEmrElement('emr-pin-pad', EmrPinPadElement);
  defineEmrElement('emr-login-form', EmrLoginFormElement);
  defineEmrElement('emr-bottom-tab-bar', EmrBottomTabBarElement);
  defineEmrElement('emr-sync-pill', EmrSyncPillElement);
  defineEmrElement('emr-toast', EmrToastElement);
  defineEmrElement('emr-sheet', EmrSheetElement);
  defineEmrElement('emr-top-bar-search', EmrTopBarSearchElement);
  defineEmrElement('emr-top-bar', EmrTopBarElement);
}
