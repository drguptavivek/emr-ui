import { css, html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';
import type {
  EmrCommandCategory,
  EmrCommandGroup,
  EmrCommandItem,
  EmrCommandPaletteIntent,
  EmrCommandPaletteViewModel,
  EmrMasterDetailIntent,
  EmrMasterDetailItem,
  EmrMasterDetailViewModel,
  EmrSplitWorkspaceIntent,
  EmrSplitWorkspacePane,
  EmrSplitWorkspacePreset,
  EmrSplitWorkspaceViewModel,
  EmrSynchronizedTimeGridIntent,
  EmrSynchronizedTimeGridViewModel,
  EmrTimeGridCell,
  EmrTimeGridResolution,
  EmrTimeGridTrack,
} from '@drguptavivek/emr-controller';
import { defineEmrElement } from './foundations.js';
import { EmrModelElement } from './controlled-rendering.js';

// ---------------------------------------------------------------------------
// Pure helper functions
// ---------------------------------------------------------------------------

const SPLIT_PRESETS: readonly { readonly id: EmrSplitWorkspacePreset; readonly label: string }[] = [
  { id: '2-pane-50-50', label: '50 / 50' },
  { id: '2-pane-40-60', label: '40 / 60' },
  { id: '3-pane', label: '3-Pane' },
  { id: 'focus-primary', label: 'Focus Primary' },
];

const COMMAND_CATEGORIES: readonly { readonly id: EmrCommandCategory; readonly label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'orders', label: 'Orders' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'smartphrases', label: 'SmartPhrases' },
  { id: 'calculators', label: 'Calculators' },
  { id: 'actions', label: 'Actions' },
];

const DEFAULT_RESOLUTIONS: readonly EmrTimeGridResolution[] = ['15m', '1h', '4h', '24h'];

function resolveSplitPresetSizes(preset: EmrSplitWorkspacePreset, paneCount = 3): readonly number[] {
  if (paneCount <= 1) return [100];
  if (paneCount === 2) {
    if (preset === '2-pane-40-60' || preset === '3-pane') return [40, 60];
    if (preset === 'focus-primary') return [75, 25];
    return [50, 50];
  }
  if (preset === '3-pane') return [25, 50, 25];
  if (preset === 'focus-primary') return [70, 15, 15];
  if (preset === '2-pane-40-60') return [35, 45, 20];
  return [40, 40, 20];
}

function stepPaneSizes(
  sizes: readonly number[],
  dividerIndex: number,
  deltaPct: number,
  minPct = 15,
): readonly number[] {
  if (dividerIndex < 0 || dividerIndex >= sizes.length - 1) return [...sizes];
  const left = sizes[dividerIndex]!;
  const right = sizes[dividerIndex + 1]!;
  const combined = left + right;
  const clampedMin = Math.min(minPct, combined / 2);
  const nextLeft = Math.max(clampedMin, Math.min(combined - clampedMin, Math.round(left + deltaPct)));
  const nextRight = combined - nextLeft;
  return sizes.map((v, idx) => {
    if (idx === dividerIndex) return nextLeft;
    if (idx === dividerIndex + 1) return nextRight;
    return v;
  });
}

function filterCommands(
  items: readonly EmrCommandItem[],
  category: EmrCommandCategory,
  query: string,
): readonly EmrCommandItem[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    if (!q) return true;
    const haystack = [
      item.label,
      item.subtitle ?? '',
      item.shortcut ?? '',
      item.groupLabel ?? '',
      item.category,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

function groupCommands(filtered: readonly EmrCommandItem[]): readonly EmrCommandGroup[] {
  const groups: { label: string; items: { item: EmrCommandItem; flatIndex: number }[] }[] = [];
  const byLabel = new Map<string, { item: EmrCommandItem; flatIndex: number }[]>();
  filtered.forEach((item, flatIndex) => {
    const label =
      item.groupLabel ??
      (item.pinned ? 'Pinned' : item.recent ? 'Recent' : item.category.toUpperCase());
    let bucket = byLabel.get(label);
    if (!bucket) {
      bucket = [];
      byLabel.set(label, bucket);
      groups.push({ label, items: bucket });
    }
    bucket.push({ item, flatIndex });
  });
  return groups;
}

function stepCommandIndex(
  items: readonly EmrCommandItem[],
  currentIndex: number,
  delta: 1 | -1,
): number {
  const count = items.length;
  if (count === 0) return -1;
  let next = currentIndex;
  for (let i = 0; i < count; i++) {
    next = (((next + delta) % count) + count) % count;
    if (!items[next]?.disabled) return next;
  }
  return -1;
}

function filterMasterDetail(
  items: readonly EmrMasterDetailItem[],
  activeFilterId: string,
  searchQuery: string,
): readonly EmrMasterDetailItem[] {
  const q = searchQuery.trim().toLowerCase();
  return items.filter((item) => {
    if (activeFilterId && activeFilterId !== 'all' && item.filterId && item.filterId !== activeFilterId) {
      return false;
    }
    if (!q) return true;
    const text = [item.title, item.subtitle ?? '', item.detailBody ?? '', item.timestampLabel ?? '']
      .join(' ')
      .toLowerCase();
    return text.includes(q);
  });
}

function toggleCheckedId(checkedIds: readonly string[], itemId: string): readonly string[] {
  return checkedIds.includes(itemId)
    ? checkedIds.filter((id) => id !== itemId)
    : [...checkedIds, itemId];
}

function clampGridOffset(offset: number, totalColumns: number, visibleColumnCount = 6): number {
  const maxOffset = Math.max(0, totalColumns - Math.max(1, visibleColumnCount));
  return Math.max(0, Math.min(maxOffset, Math.round(offset)));
}

const workstationStyles = css`
  .ws-card {
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius, 12px);
    background: var(--emr-surface);
    color: var(--emr-text);
    overflow: hidden;
  }
  .ws-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--emr-border);
    background: var(--emr-surface-soft);
  }
  .ws-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .ws-chip {
    min-height: var(--emr-compact-height, 32px);
    padding: 4px 10px;
    border: 1px solid var(--emr-border);
    border-radius: 6px;
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-bold);
    cursor: pointer;
  }
  .ws-chip[aria-pressed="true"],
  .ws-chip[aria-selected="true"] {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
    color: var(--emr-primary-contrast);
  }
  .ws-panes {
    display: flex;
    align-items: stretch;
    min-height: 260px;
  }
  .ws-pane {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    background: var(--emr-surface);
  }
  .ws-pane[data-collapsed="true"] {
    flex: 0 0 56px !important;
  }
  .ws-pane-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--emr-border);
    background: var(--emr-surface-raised);
  }
  .ws-pane-body {
    padding: 12px;
    flex: 1;
    overflow: auto;
  }
  .ws-pane-body[data-collapsed="true"] {
    display: none;
  }
  .ws-divider {
    flex: 0 0 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border-inline: 1px solid var(--emr-border);
    background: var(--emr-surface-soft);
  }
  .md-grid {
    display: grid;
    grid-template-columns: minmax(260px, 1fr) minmax(0, 1.6fr);
    min-height: 320px;
  }
  .md-master {
    border-inline-end: 1px solid var(--emr-border);
    display: flex;
    flex-direction: column;
  }
  .md-detail {
    padding: 16px;
    display: grid;
    gap: 12px;
    align-content: start;
  }
  .stg-axis,
  .stg-row {
    display: grid;
    grid-template-columns: 180px repeat(auto-fit, minmax(96px, 1fr));
    border-bottom: 1px solid var(--emr-border);
  }
  @media print {
    .ws-presets,
    .ws-mobile-tabs,
    .ws-divider,
    .ws-collapse-btn,
    .stg-controls {
      display: none !important;
    }
    .ws-panes {
      display: block;
    }
    .ws-pane,
    .ws-pane-body,
    .ws-pane-body[data-collapsed="true"],
    .stg-track-rows[data-collapsed="true"] {
      display: block !important;
      overflow: visible !important;
    }
  }
  :host-context(.emr-print) .ws-presets,
  :host-context(.emr-print) .ws-mobile-tabs,
  :host-context(.emr-print) .ws-divider,
  :host-context(.emr-print) .ws-collapse-btn,
  :host-context(.emr-print) .stg-controls {
    display: none !important;
  }
  :host-context(.emr-print) .ws-panes {
    display: block;
  }
  :host-context(.emr-print) .ws-pane,
  :host-context(.emr-print) .ws-pane-body,
  :host-context(.emr-print) .ws-pane-body[data-collapsed="true"],
  :host-context(.emr-print) .stg-track-rows[data-collapsed="true"] {
    display: block !important;
    overflow: visible !important;
  }
`;

// ===========================================================================
// 1. EmrSplitWorkspaceElement (`emr-split-workspace`)
// ===========================================================================

export class EmrSplitWorkspaceElement extends EmrModelElement<
  EmrSplitWorkspaceViewModel,
  EmrSplitWorkspaceIntent
> {
  static override styles = [...EmrModelElement.styles, workstationStyles];

  private selectPreset(preset: EmrSplitWorkspacePreset): void {
    const m = this.model;
    if (!m || m.readOnly) return;
    const count = preset === '3-pane' ? Math.min(3, m.panes.length) : Math.min(2, m.panes.length);
    const paneSizes = resolveSplitPresetSizes(preset, count);
    this.send({ type: 'presetChanged', preset, paneSizes });
  }

  private resizeDivider(dividerIndex: number, deltaPct: number): void {
    const m = this.model;
    if (!m || m.readOnly) return;
    const paneSizes = stepPaneSizes(m.paneSizes, dividerIndex, deltaPct);
    this.send({ type: 'paneResized', dividerIndex, deltaPct, paneSizes });
  }

  private toggleCollapse(pane: EmrSplitWorkspacePane): void {
    const m = this.model;
    if (!m || m.readOnly) return;
    this.send({ type: 'paneCollapsedToggled', paneId: pane.id, collapsed: !pane.collapsed });
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const visiblePanes = m.preset === '3-pane' ? m.panes.slice(0, 3) : m.panes.slice(0, 2);
    const activeMobileId = m.mobileActivePaneId ?? m.panes[0]?.id ?? '';

    return html`
      <section
        class="ws-card"
        aria-label=${this.headingId ? nothing : (m.title ?? 'Clinical Split Workstation')}
        aria-labelledby=${this.headingId || nothing}
        data-preset=${m.preset}
      >
        <header class="ws-toolbar">
          <h3 id=${this.headingId || nothing} class="emr-title">
            ${m.title ?? 'Clinical Encounter Split Workspace'}
          </h3>

          <div class="ws-row ws-presets" role="group" aria-label="Workspace layout presets">
            ${SPLIT_PRESETS.map(
              (preset) => html`
                <button
                  type="button"
                  class="ws-chip"
                  aria-pressed=${m.preset === preset.id ? 'true' : 'false'}
                  ?disabled=${!!m.readOnly}
                  @click=${() => this.selectPreset(preset.id)}
                >${preset.label}</button>
              `,
            )}
          </div>

          <div class="ws-row ws-mobile-tabs" role="tablist" aria-label="Mobile workspace panes">
            ${m.panes.map(
              (pane) => html`
                <button
                  type="button"
                  role="tab"
                  class="ws-chip"
                  aria-selected=${activeMobileId === pane.id ? 'true' : 'false'}
                  @click=${() => this.send({ type: 'mobilePaneSelected', paneId: pane.id })}
                >${pane.title}</button>
              `,
            )}
          </div>
        </header>

        <div class="ws-panes">
          ${visiblePanes.map((pane, idx) => {
            const widthPct = pane.collapsed
              ? 6
              : (m.paneSizes[idx] ?? Math.round(100 / Math.max(1, visiblePanes.length)));
            return html`
              <article
                class="ws-pane"
                data-collapsed=${pane.collapsed ? 'true' : 'false'}
                style=${`flex-basis:${widthPct}%`}
                aria-label=${pane.title}
              >
                <header class="ws-pane-head">
                  <div class="ws-row">
                    <strong>${pane.title}</strong>
                    ${pane.subtitle ? html`<span class="emr-muted">${pane.subtitle}</span>` : nothing}
                    ${pane.badge ? html`<span class="ws-chip">${pane.badge.label}</span>` : nothing}
                  </div>
                  ${pane.collapsible !== false && !m.readOnly
                    ? html`
                        <button
                          type="button"
                          class="ws-chip ws-collapse-btn"
                          aria-expanded=${!pane.collapsed ? 'true' : 'false'}
                          @click=${() => this.toggleCollapse(pane)}
                        >${pane.collapsed ? 'Expand' : 'Collapse'}</button>
                      `
                    : nothing}
                </header>

                <div class="ws-pane-body" data-collapsed=${pane.collapsed ? 'true' : 'false'}>
                  <slot name=${pane.slot}></slot>
                  ${pane.summaryItems?.length
                    ? html`
                        <ul>
                          ${pane.summaryItems.map((line) => html`<li>${line}</li>`)}
                        </ul>
                      `
                    : nothing}
                </div>
              </article>

              ${idx < visiblePanes.length - 1 && !m.readOnly
                ? html`
                    <div
                      class="ws-divider"
                      role="separator"
                      tabindex="0"
                      aria-orientation="vertical"
                      aria-label=${`Resize divider ${idx + 1}`}
                      @keydown=${(e: KeyboardEvent) => {
                        if (e.key === 'ArrowLeft') {
                          e.preventDefault();
                          this.resizeDivider(idx, -5);
                        } else if (e.key === 'ArrowRight') {
                          e.preventDefault();
                          this.resizeDivider(idx, 5);
                        }
                      }}
                    >
                      <button
                        type="button"
                        class="ws-chip"
                        aria-label=${`Shrink ${pane.title} by 5%`}
                        @click=${() => this.resizeDivider(idx, -5)}
                      >‹</button>
                      <span aria-hidden="true">⋮</span>
                      <button
                        type="button"
                        class="ws-chip"
                        aria-label=${`Grow ${pane.title} by 5%`}
                        @click=${() => this.resizeDivider(idx, 5)}
                      >›</button>
                    </div>
                  `
                : nothing}
            `;
          })}
        </div>
      </section>
    `;
  }
}

// ===========================================================================
// 2. EmrCommandPaletteElement (`emr-command-palette`)
// ===========================================================================

export class EmrCommandPaletteElement extends EmrModelElement<
  EmrCommandPaletteViewModel,
  EmrCommandPaletteIntent
> {
  static override styles = [...EmrModelElement.styles, workstationStyles];

  private onKeydown(event: KeyboardEvent, filtered: readonly EmrCommandItem[]): void {
    const m = this.model;
    if (!m) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.send({ type: 'dismissed' });
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = stepCommandIndex(filtered, m.activeIndex, delta);
      const nextItem = filtered[nextIndex];
      if (nextIndex >= 0 && nextItem) {
        this.send({ type: 'itemHighlighted', index: nextIndex, itemId: nextItem.id });
      }
      return;
    }
    if (event.key === 'Enter') {
      const current = filtered[m.activeIndex];
      if (current && !current.disabled && !m.readOnly) {
        event.preventDefault();
        this.send({ type: 'commandExecuted', itemId: current.id, item: current });
      }
    }
  }

  override render() {
    const m = this.model;
    if (!m || !m.open) return nothing;
    const filtered = filterCommands(m.items, m.activeCategory, m.query);
    const groups = groupCommands(filtered);

    return html`
      <div class="ws-backdrop" @click=${() => this.send({ type: 'dismissed' })}>
        <section
          class="ws-card"
          role="dialog"
          aria-modal="true"
          aria-label=${this.headingId ? nothing : (m.title ?? 'Clinical Command Palette')}
          aria-labelledby=${this.headingId || nothing}
          @click=${(e: Event) => e.stopPropagation()}
          @keydown=${(e: KeyboardEvent) => this.onKeydown(e, filtered)}
        >
          <header class="ws-toolbar">
            <div class="ws-row">
              <kbd class="ws-chip">⌘K</kbd>
              <h3 id=${this.headingId || nothing} class="emr-title">
                ${m.title ?? 'Quick Orders, SmartPhrases & Navigation'}
              </h3>
            </div>
            <button
              type="button"
              class="ws-chip"
              aria-label="Close command palette (Escape)"
              @click=${() => this.send({ type: 'dismissed' })}
            >Esc ✕</button>
          </header>

          <div class="emr-stack" style="padding:12px">
            <input
              type="search"
              .value=${live(m.query)}
              placeholder=${m.placeholder ?? 'Type a command, order, SmartPhrase (.iop), or route...'}
              aria-label="Search clinical commands"
              @input=${(e: Event) =>
                this.send({ type: 'queryChanged', query: (e.currentTarget as HTMLInputElement).value })}
            />

            <div class="ws-row" role="tablist" aria-label="Command categories">
              ${COMMAND_CATEGORIES.map(
                (cat) => html`
                  <button
                    type="button"
                    role="tab"
                    class="ws-chip"
                    aria-selected=${m.activeCategory === cat.id ? 'true' : 'false'}
                    @click=${() => this.send({ type: 'categoryChanged', category: cat.id })}
                  >${cat.label}</button>
                `,
              )}
            </div>

            <div role="listbox" aria-label="Matching clinical commands" class="emr-stack">
              ${!filtered.length
                ? html`<p role="status" class="emr-muted">
                    ${m.emptyMessage ?? 'No matching commands, orders, or SmartPhrases.'}
                  </p>`
                : groups.map(
                    (group) => html`
                      <div class="emr-stack">
                        <small class="emr-muted"><strong>${group.label}</strong></small>
                        ${group.items.map(
                          ({ item, flatIndex }) => html`
                            <button
                              type="button"
                              role="option"
                              class="ws-chip"
                              aria-selected=${flatIndex === m.activeIndex ? 'true' : 'false'}
                              ?disabled=${!!item.disabled || !!m.readOnly}
                              @mouseenter=${() => {
                                if (!item.disabled) {
                                  this.send({ type: 'itemHighlighted', index: flatIndex, itemId: item.id });
                                }
                              }}
                              @click=${() => {
                                if (!item.disabled && !m.readOnly) {
                                  this.send({ type: 'commandExecuted', itemId: item.id, item });
                                }
                              }}
                            >
                              <span>${item.label}</span>
                              ${item.subtitle ? html`<span class="emr-muted"> · ${item.subtitle}</span>` : nothing}
                              ${item.pinned ? html`<span> ★ Pinned</span>` : item.recent ? html`<span> Recent</span>` : nothing}
                              ${item.shortcut ? html`<kbd> [${item.shortcut}]</kbd>` : nothing}
                            </button>
                          `,
                        )}
                      </div>
                    `,
                  )}
            </div>
          </div>
        </section>
      </div>
    `;
  }
}

// ===========================================================================
// 3. EmrMasterDetailElement (`emr-master-detail`)
// ===========================================================================

export class EmrMasterDetailElement extends EmrModelElement<
  EmrMasterDetailViewModel,
  EmrMasterDetailIntent
> {
  static override styles = [...EmrModelElement.styles, workstationStyles];

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const filtered = filterMasterDetail(m.items, m.activeFilterId, m.searchQuery);
    const selected = m.items.find((item) => item.id === m.selectedId);
    const checkedIds = m.checkedIds ?? [];

    return html`
      <section
        class="ws-card md-grid"
        aria-label=${this.headingId ? nothing : m.title}
        aria-labelledby=${this.headingId || nothing}
        data-mobile-detail=${m.mobileDetailOpen ? 'open' : 'closed'}
      >
        <div class="md-master">
          <header class="ws-toolbar">
            <div>
              <h3 id=${this.headingId || nothing} class="emr-title">${m.title}</h3>
              ${m.subtitle ? html`<p class="emr-muted">${m.subtitle}</p>` : nothing}
            </div>
            ${m.batchActions?.length && checkedIds.length > 0 && !m.readOnly
              ? html`
                  <div class="ws-row">
                    ${m.batchActions.map(
                      (act) => html`
                        <button
                          type="button"
                          class="ws-chip"
                          @click=${() =>
                            this.send({ type: 'actionTriggered', actionId: act.id, itemIds: checkedIds })}
                        >${act.label} (${checkedIds.length})</button>
                      `,
                    )}
                  </div>
                `
              : nothing}
          </header>

          <div class="emr-stack" style="padding:12px">
            <input
              type="search"
              .value=${live(m.searchQuery)}
              placeholder=${m.searchPlaceholder ?? 'Filter work queue or inbox items...'}
              aria-label="Search master list"
              @input=${(e: Event) =>
                this.send({ type: 'searchChanged', query: (e.currentTarget as HTMLInputElement).value })}
            />

            ${m.filters.length
              ? html`
                  <div class="ws-row" role="tablist" aria-label="List filters">
                    ${m.filters.map(
                      (f) => html`
                        <button
                          type="button"
                          role="tab"
                          class="ws-chip"
                          aria-selected=${m.activeFilterId === f.id ? 'true' : 'false'}
                          @click=${() => this.send({ type: 'filterChanged', filterId: f.id })}
                        >
                          ${f.label}${f.count !== undefined ? ` (${f.count})` : ''}
                        </button>
                      `,
                    )}
                  </div>
                `
              : nothing}

            <slot name="master"></slot>

            <div role="listbox" aria-label=${`${m.title} items`} class="emr-stack">
              ${!filtered.length
                ? html`<p role="status" class="emr-muted">${m.emptyListMessage ?? 'No matching queue items.'}</p>`
                : filtered.map((item) => {
                    const isChecked = checkedIds.includes(item.id);
                    return html`
                      <div class="ws-row">
                        ${!m.readOnly
                          ? html`
                              <input
                                type="checkbox"
                                .checked=${live(isChecked)}
                                aria-label=${`Select ${item.title}`}
                                @change=${() => {
                                  const nextChecked = toggleCheckedId(checkedIds, item.id);
                                  this.send({
                                    type: 'batchSelectionToggled',
                                    itemId: item.id,
                                    checkedIds: nextChecked,
                                  });
                                }}
                              />
                            `
                          : nothing}
                        <button
                          type="button"
                          role="option"
                          class="ws-chip"
                          aria-selected=${item.id === m.selectedId ? 'true' : 'false'}
                          @click=${() => this.send({ type: 'itemSelected', itemId: item.id })}
                        >
                          ${item.unread ? html`<span aria-label="Unread">● </span>` : nothing}
                          <strong>${item.title}</strong>
                          ${item.subtitle ? html`<span class="emr-muted"> · ${item.subtitle}</span>` : nothing}
                          ${item.timestampLabel ? html`<span class="emr-muted"> (${item.timestampLabel})</span>` : nothing}
                          ${item.priorityBadge ? html`<span> [${item.priorityBadge.label}]</span>` : nothing}
                          ${item.statusBadge ? html`<span> [${item.statusBadge.label}]</span>` : nothing}
                        </button>
                      </div>
                    `;
                  })}
            </div>
          </div>
        </div>

        <aside class="md-detail" aria-label="Selected item detail inspector">
          <div class="ws-row">
            <button
              type="button"
              class="ws-chip"
              aria-label="Back to master list"
              @click=${() => this.send({ type: 'detailClosed' })}
            >← Back to list</button>
          </div>

          <slot name="detail"></slot>

          ${selected
            ? html`
                <article class="emr-stack">
                  <header>
                    <h4>${selected.title}</h4>
                    ${selected.subtitle ? html`<p class="emr-muted">${selected.subtitle}</p>` : nothing}
                  </header>

                  ${selected.summaryFields?.length
                    ? html`
                        <dl class="ws-row">
                          ${selected.summaryFields.map(
                            (f) => html`<div><dt>${f.label}</dt><dd><strong>${f.value}</strong></dd></div>`,
                          )}
                        </dl>
                      `
                    : nothing}

                  ${selected.detailBody ? html`<p>${selected.detailBody}</p>` : nothing}

                  ${selected.actions?.length && !m.readOnly
                    ? html`
                        <footer class="ws-row">
                          ${selected.actions.map(
                            (act) => html`
                              <button
                                type="button"
                                class="ws-chip"
                                @click=${() =>
                                  this.send({
                                    type: 'actionTriggered',
                                    actionId: act.id,
                                    itemIds: [selected.id],
                                  })}
                              >${act.label}</button>
                            `,
                          )}
                        </footer>
                      `
                    : nothing}
                </article>
              `
            : html`<p role="status" class="emr-muted">
                ${m.emptyDetailMessage ?? 'Select an item from the list to inspect details.'}
              </p>`}
        </aside>
      </section>
    `;
  }
}

// ===========================================================================
// 4. EmrSynchronizedTimeGridElement (`emr-synchronized-time-grid`)
// ===========================================================================

export class EmrSynchronizedTimeGridElement extends EmrModelElement<
  EmrSynchronizedTimeGridViewModel,
  EmrSynchronizedTimeGridIntent
> {
  static override styles = [...EmrModelElement.styles, workstationStyles];

  private stepScroll(delta: number): void {
    const m = this.model;
    if (!m || m.readOnly) return;
    const count = m.visibleColumnCount ?? m.columns.length;
    const offset = clampGridOffset(m.scrollOffset + delta, m.columns.length, count);
    this.send({ type: 'scrollOffsetChanged', offset });
  }

  private toggleTrack(track: EmrTimeGridTrack): void {
    this.send({ type: 'trackToggled', trackId: track.id, collapsed: !track.collapsed });
  }

  private selectCell(trackId: string, rowId: string, columnId: string, cell?: EmrTimeGridCell): void {
    if (this.model?.readOnly) return;
    this.send({ type: 'cellSelected', trackId, rowId, columnId, cell });
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const resolutions = m.availableResolutions ?? DEFAULT_RESOLUTIONS;
    const start = Math.max(0, m.scrollOffset);
    const count = m.visibleColumnCount ?? m.columns.length;
    const visibleColumns = m.columns.slice(start, start + count);

    return html`
      <section
        class="ws-card"
        aria-label=${this.headingId ? nothing : m.title}
        aria-labelledby=${this.headingId || nothing}
      >
        <header class="ws-toolbar">
          <div>
            <h3 id=${this.headingId || nothing} class="emr-title">${m.title}</h3>
            ${m.subtitle ? html`<p class="emr-muted">${m.subtitle}</p>` : nothing}
          </div>

          <div class="ws-row stg-controls">
            <div class="ws-row" role="group" aria-label="Time resolution zoom">
              ${resolutions.map(
                (res) => html`
                  <button
                    type="button"
                    class="ws-chip"
                    aria-pressed=${m.resolution === res ? 'true' : 'false'}
                    ?disabled=${!!m.readOnly}
                    @click=${() => {
                      if (!m.readOnly) this.send({ type: 'resolutionChanged', resolution: res });
                    }}
                  >${res}</button>
                `,
              )}
            </div>

            <div class="ws-row" role="group" aria-label="Time window scroll">
              <button
                type="button"
                class="ws-chip"
                aria-label="Scroll earlier"
                ?disabled=${!!m.readOnly || m.scrollOffset <= 0}
                @click=${() => this.stepScroll(-1)}
              >‹ Earlier</button>
              <span>Col +${m.scrollOffset}</span>
              <button
                type="button"
                class="ws-chip"
                aria-label="Scroll later"
                ?disabled=${!!m.readOnly}
                @click=${() => this.stepScroll(1)}
              >Later ›</button>
            </div>
          </div>
        </header>

        <div class="emr-scroll">
          <div class="stg-axis" role="row">
            <div><strong>Time Axis (${m.resolution})</strong></div>
            ${visibleColumns.map(
              (col) => html`
                <button
                  type="button"
                  class="ws-chip"
                  aria-pressed=${col.id === m.selectedColumnId ? 'true' : 'false'}
                  @click=${() => {
                    if (!m.readOnly) this.send({ type: 'columnSelected', columnId: col.id });
                  }}
                >
                  <span>${col.label}</span>
                  ${col.shiftBadge ? html`<small> · ${col.shiftBadge}</small>` : nothing}
                  ${col.encounterBadge ? html`<small> · ${col.encounterBadge}</small>` : nothing}
                  ${col.isCurrentTime ? html`<strong> NOW</strong>` : nothing}
                </button>
              `,
            )}
          </div>

          ${m.tracks.map(
            (track) => html`
              <section aria-label=${track.title}>
                <header class="ws-toolbar">
                  <button
                    type="button"
                    class="ws-chip"
                    aria-expanded=${!track.collapsed ? 'true' : 'false'}
                    @click=${() => this.toggleTrack(track)}
                  >
                    ${track.collapsed ? '▸' : '▾'} ${track.title} (${track.kind.toUpperCase()})
                  </button>
                </header>

                <div class="stg-track-rows" data-collapsed=${track.collapsed ? 'true' : 'false'}>
                  ${track.rows.map(
                    (row) => html`
                      <div class="stg-row" role="row">
                        <div role="rowheader">
                          <strong>${row.label}</strong>
                          ${row.unitLabel ? html`<small class="emr-muted"> (${row.unitLabel})</small>` : nothing}
                          ${row.referenceRangeLabel
                            ? html`<small class="emr-muted"> [${row.referenceRangeLabel}]</small>`
                            : nothing}
                        </div>

                        ${visibleColumns.map((col) => {
                          const cell = row.cells[col.id];
                          const selected =
                            m.selectedCell?.trackId === track.id &&
                            m.selectedCell?.rowId === row.id &&
                            m.selectedCell?.columnId === col.id;
                          return html`
                            <button
                              type="button"
                              class="ws-chip"
                              aria-pressed=${selected ? 'true' : 'false'}
                              @click=${() => this.selectCell(track.id, row.id, col.id, cell)}
                            >
                              ${cell
                                ? html`
                                    <strong>${cell.valueLabel}</strong>
                                    ${cell.secondaryLabel ? html`<small> ${cell.secondaryLabel}</small>` : nothing}
                                  `
                                : html`<span>—</span>`}
                            </button>
                          `;
                        })}
                      </div>
                    `,
                  )}
                </div>
              </section>
            `,
          )}
        </div>
      </section>
    `;
  }
}

export function registerL3WorkstationElements(): void {
  defineEmrElement('emr-split-workspace', EmrSplitWorkspaceElement);
  defineEmrElement('emr-command-palette', EmrCommandPaletteElement);
  defineEmrElement('emr-master-detail', EmrMasterDetailElement);
  defineEmrElement('emr-synchronized-time-grid', EmrSynchronizedTimeGridElement);
}
