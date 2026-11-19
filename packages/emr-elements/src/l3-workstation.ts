import { css, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import {
  COMMAND_PALETTE_CATEGORIES,
  TIME_GRID_RESOLUTIONS,
  canExecuteCommandItem,
  canMutateMasterDetail,
  canMutateSplitWorkspace,
  canStepTimeGridScroll,
  clampTimeGridScrollOffset,
  filterCommandPaletteItems,
  filterMasterDetailItems,
  groupCommandPaletteItems,
  resolveCommandPaletteHeadingId,
  resolveCommandPaletteId,
  resolveCommandPaletteListboxId,
  resolveCommandPaletteOptionId,
  resolveCommandPalettePresentation,
  resolveMasterDetailHeadingId,
  resolveMasterDetailId,
  resolveSplitWorkspaceDividerBounds,
  resolveSplitWorkspaceHeadingId,
  resolveSplitWorkspaceId,
  resolveSplitWorkspacePresetSizes,
  resolveSynchronizedTimeGridHeadingId,
  resolveSynchronizedTimeGridId,
  resolveTimeGridVisibleColumns,
  stepCommandPaletteIndex,
  stepSplitWorkspacePaneSizes,
  toggleMasterDetailCheckedId,
  visibleSplitWorkspacePanes,
  type EmrCommandItem,
  type EmrCommandPaletteIntent,
  type EmrCommandPaletteLabels,
  type EmrCommandPaletteViewModel,
  type EmrMasterDetailIntent,
  type EmrMasterDetailLabels,
  type EmrMasterDetailViewModel,
  type EmrSplitWorkspaceIntent,
  type EmrSplitWorkspaceLabels,
  type EmrSplitWorkspacePane,
  type EmrSplitWorkspacePreset,
  type EmrSplitWorkspaceViewModel,
  type EmrSynchronizedTimeGridIntent,
  type EmrSynchronizedTimeGridLabels,
  type EmrSynchronizedTimeGridViewModel,
  type EmrTimeGridCell,
  type EmrTimeGridResolution,
  type EmrTimeGridTrack,
} from '@drguptavivek/emr-controller';
import { EmrModelElement } from './controlled-rendering.js';
import { defineEmrElement } from './foundations.js';
import { renderEmrSvgIcon } from './icons.js';

const SPLIT_PRESETS: readonly { readonly id: EmrSplitWorkspacePreset; readonly label: string }[] = [
  { id: '2-pane-50-50', label: '50 / 50' },
  { id: '2-pane-40-60', label: '40 / 60' },
  { id: '3-pane', label: '3-Pane' },
  { id: 'focus-primary', label: 'Focus Primary' },
];

const DEFAULT_RESOLUTIONS: readonly EmrTimeGridResolution[] = TIME_GRID_RESOLUTIONS.map((r) => r.id);

function clampSparkNorm(value?: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(1, value));
}

const workstationStyles = css`
  :host {
    display: block;
    min-width: 0;
    max-width: 100%;
    container-type: inline-size;
  }
  .ws-card {
    border: 1px solid var(--emr-border);
    border-radius: var(--emr-radius-lg, 12px);
    background: var(--emr-surface);
    color: var(--emr-text);
    overflow: hidden;
    min-width: 0;
    max-width: 100%;
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
    min-width: 0;
  }
  .ws-title-group {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    min-width: 0;
  }
  .ws-tag {
    padding: 3px 8px;
    border-radius: 6px;
    background: var(--emr-primary);
    color: var(--emr-surface);
    font-family: var(--emr-font-mono);
    font-size: var(--emr-text-2xs);
    font-weight: var(--emr-weight-bold);
  }
  .ws-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
  .ws-chip {
    min-height: 44px;
    min-width: 44px;
    padding: 6px 12px;
    border: 1px solid var(--emr-border);
    border-radius: 6px;
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-bold);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }
  .ws-chip[aria-pressed="true"],
  .ws-chip[aria-selected="true"] {
    border-color: var(--emr-primary);
    background: var(--emr-primary-soft);
    color: var(--emr-primary-contrast);
  }
  .ws-chip[aria-disabled="true"] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .ws-chip:focus-visible,
  .ws-grip:focus-visible,
  .ws-input:focus-visible,
  .md-item-btn:focus-visible,
  .md-checkbox:focus-visible,
  .stg-col-head:focus-visible,
  .stg-track-toggle:focus-visible,
  .stg-cell:focus-visible {
    outline: 3px solid var(--emr-focus);
    outline-offset: 2px;
  }
  .ws-grip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
    border-radius: 6px;
    color: var(--emr-text-muted);
    cursor: col-resize;
  }
  .ws-input {
    width: 100%;
    min-height: 44px;
    padding: 8px 12px;
    border: 1px solid var(--emr-border);
    border-radius: 8px;
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-md);
  }
  .ws-pill-badge {
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--emr-neutral-soft);
    color: var(--emr-text);
    font-size: var(--emr-text-2xs);
    font-weight: var(--emr-weight-bold);
    white-space: nowrap;
  }
  .ws-pill-badge[data-tone="info"] {
    background: var(--emr-info-soft);
    color: var(--emr-info);
  }
  .ws-pill-badge[data-tone="success"] {
    background: var(--emr-success-soft);
    color: var(--emr-success);
  }
  .ws-pill-badge[data-tone="warning"] {
    background: var(--emr-warning-soft);
    color: var(--emr-warning);
  }
  .ws-pill-badge[data-tone="danger"] {
    background: var(--emr-danger-soft);
    color: var(--emr-danger);
  }

  /* Split Workspace */
  .ws-mobile-tabs {
    display: none;
  }
  .ws-panes {
    display: flex;
    align-items: stretch;
    min-height: 260px;
    min-width: 0;
  }
  .ws-pane {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    background: var(--emr-surface);
  }
  .ws-pane[data-collapsed="true"] {
    flex: 0 0 64px !important;
  }
  .ws-pane-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--emr-border);
    background: var(--emr-surface-raised);
    min-width: 0;
  }
  .ws-pane-body {
    padding: 12px;
    flex: 1;
    overflow: auto;
    min-width: 0;
  }
  .ws-pane-body[data-collapsed="true"] {
    display: none;
  }
  .ws-divider {
    flex: 0 0 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 4px 2px;
    border-inline: 1px solid var(--emr-border);
    background: var(--emr-surface-soft);
    cursor: col-resize;
  }
  .ws-step-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 4px;
  }

  /* Command Palette */
  .cmd-backdrop--modal {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 48px 16px 16px;
    background: var(--emr-backdrop, rgba(15, 23, 42, 0.45));
    overflow-y: auto;
  }
  .cmd-backdrop--inline {
    padding: 0;
    min-width: 0;
    max-width: 100%;
  }
  .cmd-dialog {
    width: 100%;
    max-width: 680px;
    margin: 0 auto;
    box-shadow: var(--emr-shadow);
  }
  .cmd-dialog--inline {
    max-width: 100%;
    box-shadow: none;
  }
  .cmd-listbox {
    max-height: 360px;
    overflow-y: auto;
    padding: 8px;
    display: grid;
    gap: 8px;
  }
  .cmd-option {
    width: 100%;
    justify-content: space-between;
    text-align: start;
    flex-wrap: wrap;
    padding: 8px 10px;
    border-color: transparent;
    background: transparent;
  }
  .cmd-option[aria-selected="true"],
  .cmd-option:hover:not([aria-disabled="true"]) {
    border-color: var(--emr-primary-border);
    background: var(--emr-primary-soft);
  }
  .cmd-pin {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--emr-warning);
    font-size: var(--emr-text-2xs);
    font-weight: var(--emr-weight-bold);
  }
  .cmd-recent {
    color: var(--emr-info);
    font-size: var(--emr-text-2xs);
    font-weight: var(--emr-weight-bold);
  }
  .cmd-kbd {
    padding: 2px 7px;
    border: 1px solid var(--emr-border);
    border-radius: 5px;
    background: var(--emr-surface-raised);
    font-family: var(--emr-font-mono);
    font-size: var(--emr-text-2xs);
    font-weight: var(--emr-weight-bold);
  }

  /* Master Detail */
  .md-grid {
    display: grid;
    grid-template-columns: minmax(260px, 1fr) minmax(0, 1.6fr);
    min-height: 320px;
  }
  .md-master {
    border-inline-end: 1px solid var(--emr-border);
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .md-list {
    margin: 0;
    padding: 0;
    list-style: none;
    overflow-y: auto;
    flex: 1;
    min-width: 0;
  }
  .md-item {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding: 6px 10px;
    border-bottom: 1px solid var(--emr-border);
    min-width: 0;
  }
  .md-item--selected {
    background: var(--emr-primary-soft);
  }
  .md-check-hit {
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    cursor: pointer;
    border-radius: 6px;
  }
  .md-checkbox {
    width: 18px;
    height: 18px;
    margin: 0;
    accent-color: var(--emr-primary);
    cursor: pointer;
  }
  .md-item-btn {
    flex: 1;
    min-height: 44px;
    min-width: 0;
    padding: 4px 6px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--emr-text);
    text-align: start;
    font: inherit;
    cursor: pointer;
    display: grid;
    gap: 4px;
  }
  .md-item-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  .md-item-title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: var(--emr-text-sm);
    font-weight: var(--emr-weight-bold);
    overflow-wrap: anywhere;
  }
  .md-unread-dot {
    color: var(--emr-primary);
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }
  .md-detail {
    padding: 16px;
    display: grid;
    gap: 12px;
    align-content: start;
    min-width: 0;
  }
  .md-mobile-bar {
    display: none;
  }

  /* Synchronized Time Grid */
  .stg-scroll {
    overflow-x: auto;
    max-width: 100%;
    min-width: 0;
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
  }
  .stg-grid {
    width: max-content;
    min-width: 100%;
  }
  .stg-axis,
  .stg-row {
    display: grid;
    grid-template-columns: 124px repeat(var(--emr-stg-cols, 4), minmax(108px, 1fr));
    border-bottom: 1px solid var(--emr-border);
  }
  .stg-lead {
    position: sticky;
    left: 0;
    z-index: 2;
    width: 124px;
    min-width: 124px;
    max-width: 124px;
    padding: 8px 10px;
    border-inline-end: 1px solid var(--emr-border);
    background: var(--emr-surface-raised);
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
  }
  .stg-col-head {
    min-width: 108px;
    min-height: 44px;
    padding: 6px 8px;
    border: 0;
    border-inline-end: 1px solid var(--emr-border);
    background: var(--emr-surface-raised);
    color: var(--emr-text);
    font: inherit;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    cursor: pointer;
    white-space: nowrap;
  }
  .stg-col-head[aria-pressed="true"],
  .stg-col-head[data-current="true"] {
    background: var(--emr-primary-soft);
  }
  .stg-track-head {
    background: var(--emr-surface-accent);
    border-bottom: 1px solid var(--emr-border);
  }
  .stg-track-toggle {
    width: 100%;
    min-height: 44px;
    padding: 8px 12px;
    border: 0;
    background: transparent;
    color: var(--emr-text);
    font: inherit;
    font-size: var(--emr-text-xs);
    font-weight: var(--emr-weight-bold);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    cursor: pointer;
  }
  .stg-track-label-group {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    position: sticky;
    left: 12px;
  }
  .stg-track-rows[data-collapsed="true"] {
    display: none;
  }
  .stg-cell {
    min-width: 108px;
    min-height: 44px;
    padding: 6px 8px;
    border: 0;
    border-inline-end: 1px solid var(--emr-border);
    background: var(--emr-surface);
    color: var(--emr-text);
    font: inherit;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    cursor: pointer;
  }
  .stg-cell[aria-pressed="true"] {
    box-shadow: inset 0 0 0 2px var(--emr-primary);
    background: var(--emr-primary-soft);
  }
  .stg-cell[data-tone="neutral"] { background: var(--emr-neutral-soft); color: var(--emr-text); }
  .stg-cell[data-tone="info"] { background: var(--emr-info-soft); color: var(--emr-info); }
  .stg-cell[data-tone="success"] { background: var(--emr-success-soft); color: var(--emr-success); }
  .stg-cell[data-tone="warning"] { background: var(--emr-warning-soft); color: var(--emr-warning); }
  .stg-cell[data-tone="danger"] { background: var(--emr-danger-soft); color: var(--emr-danger); }
  .stg-cell[aria-disabled="true"],
  .stg-col-head[aria-disabled="true"] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .stg-spark {
    width: 100%;
    max-width: 84px;
    height: 4px;
    border-radius: 999px;
    background: var(--emr-neutral-soft);
    overflow: hidden;
  }
  .stg-spark-fill {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: var(--emr-primary);
  }
  .stg-spark-fill[data-tone="info"] { background: var(--emr-info); }
  .stg-spark-fill[data-tone="success"] { background: var(--emr-success); }
  .stg-spark-fill[data-tone="warning"] { background: var(--emr-warning); }
  .stg-spark-fill[data-tone="danger"] { background: var(--emr-danger); }
  .stg-note {
    font-size: var(--emr-text-2xs);
    color: var(--emr-text-muted);
    max-width: 96px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @container (max-width: 720px) {
    .ws-mobile-tabs { display: flex; width: 100%; }
    .ws-panes { flex-direction: column; min-height: 0; }
    .ws-divider { display: none; }
    .ws-pane:not([data-mobile-active="true"]) { display: none; }
    .ws-pane[data-mobile-active="true"] { flex: 1 1 auto !important; flex-basis: auto !important; width: 100%; }

    .md-grid { grid-template-columns: minmax(0, 1fr); }
    .md-master { border-inline-end: 0; }
    .md-mobile-bar { display: flex; }
    .md-grid[data-mobile-detail="open"] .md-master { display: none; }
    .md-grid[data-mobile-detail="closed"] .md-detail { display: none; }
  }
  @media (max-width: 720px) {
    .ws-mobile-tabs { display: flex; width: 100%; }
    .ws-panes { flex-direction: column; min-height: 0; }
    .ws-divider { display: none; }
    .ws-pane:not([data-mobile-active="true"]) { display: none; }
    .ws-pane[data-mobile-active="true"] { flex: 1 1 auto !important; flex-basis: auto !important; width: 100%; }

    .md-grid { grid-template-columns: minmax(0, 1fr); }
    .md-master { border-inline-end: 0; }
    .md-mobile-bar { display: flex; }
    .md-grid[data-mobile-detail="open"] .md-master { display: none; }
    .md-grid[data-mobile-detail="closed"] .md-detail { display: none; }
  }

  @media print {
    .ws-presets,
    .ws-mobile-tabs,
    .ws-divider,
    .ws-collapse-btn,
    .stg-controls,
    [data-emr-print="hide"] {
      display: none !important;
    }
    .ws-panes {
      display: block;
    }
    .ws-pane,
    .ws-pane[data-collapsed="true"] {
      display: block !important;
      width: 100% !important;
      flex-basis: auto !important;
    }
    .ws-pane-body,
    .ws-pane-body[data-collapsed="true"],
    .cmd-listbox,
    .md-list,
    .stg-scroll,
    .stg-track-rows[data-collapsed="true"] {
      display: block !important;
      overflow: visible !important;
      max-height: none !important;
      max-width: none !important;
    }
    .cmd-backdrop--modal {
      position: static !important;
      padding: 0 !important;
      background: transparent !important;
    }
    .md-grid {
      display: block !important;
    }
    .md-master,
    .md-detail {
      display: block !important;
      border-inline-end: 0 !important;
    }
    .stg-lead,
    .stg-track-label-group {
      position: static !important;
    }
  }
  :host-context(.emr-print) .ws-presets,
  :host-context(.emr-print) .ws-mobile-tabs,
  :host-context(.emr-print) .ws-divider,
  :host-context(.emr-print) .ws-collapse-btn,
  :host-context(.emr-print) .stg-controls,
  :host-context(.emr-print) [data-emr-print="hide"] {
    display: none !important;
  }
  :host-context(.emr-print) .ws-panes {
    display: block;
  }
  :host-context(.emr-print) .ws-pane,
  :host-context(.emr-print) .ws-pane[data-collapsed="true"] {
    display: block !important;
    width: 100% !important;
    flex-basis: auto !important;
  }
  :host-context(.emr-print) .ws-pane-body,
  :host-context(.emr-print) .ws-pane-body[data-collapsed="true"],
  :host-context(.emr-print) .cmd-listbox,
  :host-context(.emr-print) .md-list,
  :host-context(.emr-print) .stg-scroll,
  :host-context(.emr-print) .stg-track-rows[data-collapsed="true"] {
    display: block !important;
    overflow: visible !important;
    max-height: none !important;
    max-width: none !important;
  }
  :host-context(.emr-print) .cmd-backdrop--modal {
    position: static !important;
    padding: 0 !important;
    background: transparent !important;
  }
  :host-context(.emr-print) .md-grid {
    display: block !important;
  }
  :host-context(.emr-print) .md-master,
  :host-context(.emr-print) .md-detail {
    display: block !important;
    border-inline-end: 0 !important;
  }
  :host-context(.emr-print) .stg-lead,
  :host-context(.emr-print) .stg-track-label-group {
    position: static !important;
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

  @property({ type: String }) idPrefix = '';
  @property({ attribute: false }) labels: Partial<EmrSplitWorkspaceLabels> = {};

  private selectPreset(preset: EmrSplitWorkspacePreset): void {
    const m = this.model;
    if (!m || !canMutateSplitWorkspace(m)) return;
    const count = preset === '3-pane' ? Math.min(3, m.panes.length) : Math.min(2, m.panes.length);
    const paneSizes = resolveSplitWorkspacePresetSizes(preset, count);
    this.send({ type: 'presetChanged', preset, paneSizes });
  }

  private resizeDivider(dividerIndex: number, deltaPct: number, panes: readonly EmrSplitWorkspacePane[]): void {
    const m = this.model;
    if (!m || !canMutateSplitWorkspace(m)) return;
    const paneSizes = stepSplitWorkspacePaneSizes(m.paneSizes, dividerIndex, deltaPct, panes);
    this.send({ type: 'paneResized', dividerIndex, deltaPct, paneSizes });
  }

  private toggleCollapse(pane: EmrSplitWorkspacePane): void {
    const m = this.model;
    if (!m || !canMutateSplitWorkspace(m)) return;
    this.send({ type: 'paneCollapsedToggled', paneId: pane.id, collapsed: !pane.collapsed });
  }

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const visiblePanes = visibleSplitWorkspacePanes(m.panes, m.preset);
    const activeMobileId =
      m.mobileActivePaneId && visiblePanes.some((p) => p.id === m.mobileActivePaneId)
        ? m.mobileActivePaneId
        : (visiblePanes[0]?.id ?? m.panes[0]?.id ?? '');
    const rootId = resolveSplitWorkspaceId(m.id, this.idPrefix);
    const resolvedHeadingId = resolveSplitWorkspaceHeadingId(m.id, this.idPrefix, this.headingId);

    return html`
      <section
        class="ws-card"
        id=${rootId}
        aria-labelledby=${resolvedHeadingId}
        data-preset=${m.preset}
      >
        <header class="ws-toolbar">
          <div class="ws-title-group">
            <span class="ws-tag">${this.labels.tag ?? 'WORKSTATION'}</span>
            <h3 id=${resolvedHeadingId} class="emr-title">
              ${m.title ?? this.labels.defaultTitle ?? 'Clinical Encounter Split Workspace'}
            </h3>
          </div>

          <div class="ws-row ws-presets" role="group" aria-label=${this.labels.presetsLabel ?? 'Workspace layout presets'} data-emr-print="hide">
            ${SPLIT_PRESETS.map(
              (preset) => html`
                <button
                  type="button"
                  class="ws-chip"
                  aria-pressed=${m.preset === preset.id ? 'true' : 'false'}
                  aria-disabled=${m.readOnly ? 'true' : nothing}
                  @click=${() => this.selectPreset(preset.id)}
                >${preset.label}</button>
              `,
            )}
          </div>

          <div class="ws-row ws-mobile-tabs" role="tablist" aria-label=${this.labels.mobileTabsLabel ?? 'Mobile workspace panes'} data-emr-print="hide">
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
            const bounds = resolveSplitWorkspaceDividerBounds(m.paneSizes, idx, visiblePanes);
            return html`
              <article
                class="ws-pane"
                data-collapsed=${pane.collapsed ? 'true' : 'false'}
                data-mobile-active=${activeMobileId === pane.id ? 'true' : 'false'}
                style=${`flex-basis:${widthPct}%`}
                aria-label=${pane.title}
              >
                <header class="ws-pane-head">
                  <div class="ws-row">
                    <strong>${pane.title}</strong>
                    ${pane.subtitle ? html`<span class="emr-muted">${pane.subtitle}</span>` : nothing}
                    ${pane.badge
                      ? html`<span class="ws-pill-badge" data-tone=${pane.badge.tone}>${pane.badge.label}</span>`
                      : nothing}
                  </div>
                  ${pane.collapsible !== false && !m.readOnly
                    ? html`
                        <button
                          type="button"
                          class="ws-chip ws-collapse-btn"
                          data-emr-print="hide"
                          aria-expanded=${!pane.collapsed ? 'true' : 'false'}
                          aria-label=${`${pane.collapsed ? 'Expand' : 'Collapse'} ${pane.title}`}
                          @click=${() => this.toggleCollapse(pane)}
                        >${pane.collapsed ? (this.labels.expand ?? 'Expand') : (this.labels.collapse ?? 'Collapse')}</button>
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
                    <div class="ws-divider" data-emr-print="hide">
                      <button
                        type="button"
                        class="ws-chip ws-step-btn"
                        aria-label=${`Shrink ${pane.title} by 5%`}
                        @click=${() => this.resizeDivider(idx, -5, visiblePanes)}
                      >${renderEmrSvgIcon('chevron-left', 16)}</button>
                      <div
                        class="ws-grip"
                        role="separator"
                        tabindex="0"
                        aria-orientation="vertical"
                        aria-label=${`Resize divider ${idx + 1}`}
                        aria-valuemin=${String(bounds.min)}
                        aria-valuemax=${String(bounds.max)}
                        aria-valuenow=${String(bounds.now)}
                        @keydown=${(e: KeyboardEvent) => {
                          if (e.key === 'ArrowLeft') {
                            e.preventDefault();
                            this.resizeDivider(idx, -5, visiblePanes);
                          } else if (e.key === 'ArrowRight') {
                            e.preventDefault();
                            this.resizeDivider(idx, 5, visiblePanes);
                          } else if (e.key === 'Home') {
                            e.preventDefault();
                            this.resizeDivider(idx, -100, visiblePanes);
                          } else if (e.key === 'End') {
                            e.preventDefault();
                            this.resizeDivider(idx, 100, visiblePanes);
                          }
                        }}
                      >${renderEmrSvgIcon('more-vertical', 16)}</div>
                      <button
                        type="button"
                        class="ws-chip ws-step-btn"
                        aria-label=${`Grow ${pane.title} by 5%`}
                        @click=${() => this.resizeDivider(idx, 5, visiblePanes)}
                      >${renderEmrSvgIcon('chevron-right', 16)}</button>
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

  @property({ type: String }) idPrefix = '';
  @property({ attribute: false }) labels: Partial<EmrCommandPaletteLabels> = {};

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
      const nextIndex = stepCommandPaletteIndex(filtered, m.activeIndex, delta);
      const nextItem = filtered[nextIndex];
      if (nextIndex >= 0 && nextItem) {
        this.send({ type: 'itemHighlighted', index: nextIndex, itemId: nextItem.id });
      }
      return;
    }
    if (event.key === 'Enter') {
      const current = filtered[m.activeIndex];
      if (canExecuteCommandItem(m, current)) {
        event.preventDefault();
        this.send({ type: 'commandExecuted', itemId: current!.id, item: current! });
      }
    }
  }

  override render() {
    const m = this.model;
    if (!m || !m.open) return nothing;
    const presentation = resolveCommandPalettePresentation(m);
    const isModal = presentation === 'modal';
    const rootId = resolveCommandPaletteId(m.id, this.idPrefix);
    const resolvedHeadingId = resolveCommandPaletteHeadingId(m.id, this.idPrefix, this.headingId);
    const listboxId = resolveCommandPaletteListboxId(m.id, this.idPrefix);
    const filtered = filterCommandPaletteItems(m.items, m.activeCategory, m.query);
    const groups = groupCommandPaletteItems(filtered);
    const activeItem = filtered[m.activeIndex];
    const activeOptionId = activeItem
      ? resolveCommandPaletteOptionId(m.id, activeItem.id, this.idPrefix)
      : undefined;

    return html`
      <div
        class=${isModal ? 'cmd-backdrop--modal' : 'cmd-backdrop--inline'}
        @click=${() => {
          if (isModal) this.send({ type: 'dismissed' });
        }}
      >
        <section
          class=${isModal ? 'ws-card cmd-dialog' : 'ws-card cmd-dialog cmd-dialog--inline'}
          id=${rootId}
          role=${isModal ? 'dialog' : 'region'}
          aria-modal=${isModal ? 'true' : nothing}
          aria-labelledby=${resolvedHeadingId}
          @click=${(e: Event) => e.stopPropagation()}
          @keydown=${(e: KeyboardEvent) => this.onKeydown(e, filtered)}
        >
          <header class="ws-toolbar">
            <div class="ws-row">
              <kbd class="cmd-kbd" data-emr-print="hide">⌘K</kbd>
              <h3 id=${resolvedHeadingId} class="emr-title">
                ${m.title ?? this.labels.defaultTitle ?? 'Quick Orders, SmartPhrases & Navigation'}
              </h3>
            </div>
            <button
              type="button"
              class="ws-chip"
              data-emr-print="hide"
              aria-label=${this.labels.closeLabel ?? 'Close command palette (Escape)'}
              @click=${() => this.send({ type: 'dismissed' })}
            >
              <span>Esc</span>
              ${renderEmrSvgIcon('close', 14)}
            </button>
          </header>

          <div class="emr-stack" style="padding:12px">
            <input
              type="search"
              class="ws-input"
              role="combobox"
              aria-autocomplete="list"
              data-emr-print="hide"
              aria-expanded=${m.open ? 'true' : 'false'}
              aria-controls=${listboxId}
              aria-activedescendant=${activeOptionId ?? nothing}
              .value=${live(m.query)}
              placeholder=${m.placeholder ?? this.labels.defaultPlaceholder ?? 'Type a command, order, SmartPhrase (.iop), or route...'}
              aria-label=${this.labels.searchLabel ?? 'Search clinical commands'}
              @input=${(e: Event) =>
                this.send({ type: 'queryChanged', query: (e.currentTarget as HTMLInputElement).value })}
            />

            <div class="ws-row" role="tablist" aria-label=${this.labels.categoriesLabel ?? 'Command categories'} data-emr-print="hide">
              ${COMMAND_PALETTE_CATEGORIES.map(
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

            <div id=${listboxId} role="listbox" aria-label=${this.labels.resultsLabel ?? 'Matching clinical commands'} class="cmd-listbox">
              ${!filtered.length
                ? html`<p role="status" class="emr-muted">
                    ${m.emptyMessage ?? this.labels.emptyMessage ?? 'No matching commands, orders, or SmartPhrases.'}
                  </p>`
                : groups.map(
                    (group) => html`
                      <div class="emr-stack">
                        <small class="emr-muted"><strong>${group.label}</strong></small>
                        ${group.items.map(
                          ({ item, flatIndex }) => {
                            const inert = Boolean(item.disabled || m.readOnly);
                            const optId = resolveCommandPaletteOptionId(m.id, item.id, this.idPrefix);
                            return html`
                              <button
                                type="button"
                                role="option"
                                id=${optId}
                                class="ws-chip cmd-option"
                                aria-selected=${flatIndex === m.activeIndex ? 'true' : 'false'}
                                aria-disabled=${inert ? 'true' : nothing}
                                @mouseenter=${() => {
                                  if (!item.disabled) {
                                    this.send({ type: 'itemHighlighted', index: flatIndex, itemId: item.id });
                                  }
                                }}
                                @click=${() => {
                                  if (canExecuteCommandItem(m, item)) {
                                    this.send({ type: 'commandExecuted', itemId: item.id, item });
                                  }
                                }}
                              >
                                <span class="ws-row">
                                  <strong>${item.label}</strong>
                                  ${item.subtitle ? html`<span class="emr-muted">${item.subtitle}</span>` : nothing}
                                </span>
                                <span class="ws-row">
                                  ${item.pinned
                                    ? html`<span class="cmd-pin">${renderEmrSvgIcon('star-filled', 12)} <span>${this.labels.pinnedLabel ?? 'Pinned'}</span></span>`
                                    : item.recent
                                      ? html`<span class="cmd-recent">${this.labels.recentLabel ?? 'Recent'}</span>`
                                      : nothing}
                                  ${item.badge
                                    ? html`<span class="ws-pill-badge" data-tone=${item.badge.tone}>${item.badge.label}</span>`
                                    : nothing}
                                  ${item.shortcut ? html`<kbd class="cmd-kbd">${item.shortcut}</kbd>` : nothing}
                                </span>
                              </button>
                            `;
                          },
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

  @property({ type: String }) idPrefix = '';
  @property({ attribute: false }) labels: Partial<EmrMasterDetailLabels> = {};

  override render() {
    const m = this.model;
    if (!m) return nothing;
    const filtered = filterMasterDetailItems(m.items, m.activeFilterId, m.searchQuery);
    const selected = m.items.find((item) => item.id === m.selectedId);
    const checkedIds = m.checkedIds ?? [];
    const rootId = resolveMasterDetailId(m.id, this.idPrefix);
    const resolvedHeadingId = resolveMasterDetailHeadingId(m.id, this.idPrefix, this.headingId);

    return html`
      <section
        class="ws-card md-grid"
        id=${rootId}
        aria-labelledby=${resolvedHeadingId}
        data-mobile-detail=${m.mobileDetailOpen ? 'open' : 'closed'}
      >
        <div class="md-master">
          <header class="ws-toolbar">
            <div>
              <h3 id=${resolvedHeadingId} class="emr-title">${m.title}</h3>
              ${m.subtitle ? html`<p class="emr-muted">${m.subtitle}</p>` : nothing}
            </div>
            ${m.batchActions?.length && checkedIds.length > 0 && !m.readOnly
              ? html`
                  <div class="ws-row" data-emr-print="hide">
                    ${m.batchActions.map(
                      (act) => html`
                        <button
                          type="button"
                          class="ws-chip"
                          aria-pressed=${act.primary ? 'true' : nothing}
                          @click=${() => {
                            if (canMutateMasterDetail(m)) {
                              this.send({ type: 'actionTriggered', actionId: act.id, itemIds: checkedIds });
                            }
                          }}
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
              class="ws-input"
              data-emr-print="hide"
              .value=${live(m.searchQuery)}
              placeholder=${m.searchPlaceholder ?? this.labels.searchPlaceholder ?? 'Filter work queue or inbox items...'}
              aria-label=${this.labels.searchLabel ?? 'Search master list'}
              @input=${(e: Event) =>
                this.send({ type: 'searchChanged', query: (e.currentTarget as HTMLInputElement).value })}
            />

            ${m.filters.length
              ? html`
                  <div class="ws-row" role="tablist" aria-label=${this.labels.filtersLabel ?? 'List filters'} data-emr-print="hide">
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

            ${!filtered.length
              ? html`<p role="status" class="emr-muted">${m.emptyListMessage ?? this.labels.emptyListMessage ?? 'No matching queue items.'}</p>`
              : html`
                  <ul class="md-list" aria-label=${`${m.title} items`}>
                    ${filtered.map((item) => {
                      const isChecked = checkedIds.includes(item.id);
                      const isSelected = item.id === m.selectedId;
                      return html`
                        <li class=${isSelected ? 'md-item md-item--selected' : 'md-item'}>
                          ${!m.readOnly
                            ? html`
                                <label class="md-check-hit" data-emr-print="hide">
                                  <input
                                    type="checkbox"
                                    class="md-checkbox"
                                    .checked=${live(isChecked)}
                                    aria-label=${`Select ${item.title}`}
                                    @change=${() => {
                                      if (!canMutateMasterDetail(m)) return;
                                      const nextChecked = toggleMasterDetailCheckedId(checkedIds, item.id);
                                      this.send({
                                        type: 'batchSelectionToggled',
                                        itemId: item.id,
                                        checkedIds: nextChecked,
                                      });
                                    }}
                                  />
                                </label>
                              `
                            : nothing}
                          <button
                            type="button"
                            class="md-item-btn"
                            data-item-id=${item.id}
                            aria-current=${isSelected ? 'true' : nothing}
                            @click=${() => this.send({ type: 'itemSelected', itemId: item.id })}
                          >
                            <div class="md-item-top">
                              <span class="md-item-title">
                                ${item.unread
                                  ? html`
                                      <span class="md-unread-dot" aria-hidden="true">
                                        <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true" focusable="false">
                                          <circle cx="4" cy="4" r="4" fill="currentColor" />
                                        </svg>
                                      </span>
                                      <span class="emr-sr-only">Unread: </span>
                                    `
                                  : nothing}
                                <span>${item.title}</span>
                              </span>
                              ${item.timestampLabel ? html`<span class="emr-muted">${item.timestampLabel}</span>` : nothing}
                            </div>
                            ${item.subtitle ? html`<span class="emr-muted">${item.subtitle}</span>` : nothing}
                            <div class="ws-row">
                              ${item.priorityBadge
                                ? html`<span class="ws-pill-badge" data-tone=${item.priorityBadge.tone}>${item.priorityBadge.label}</span>`
                                : nothing}
                              ${item.statusBadge
                                ? html`<span class="ws-pill-badge" data-tone=${item.statusBadge.tone}>${item.statusBadge.label}</span>`
                                : nothing}
                            </div>
                          </button>
                        </li>
                      `;
                    })}
                  </ul>
                `}
          </div>
        </div>

        <aside class="md-detail" aria-label=${this.labels.detailLabel ?? 'Selected item detail inspector'}>
          <div class="ws-row md-mobile-bar" data-emr-print="hide">
            <button
              type="button"
              class="ws-chip"
              aria-label=${this.labels.backToList ?? 'Back to master list'}
              @click=${() => {
                this.send({ type: 'detailClosed' });
                setTimeout(() => {
                  const target =
                    this.shadowRoot?.querySelector<HTMLElement>('.md-item-btn[aria-current="true"]') ??
                    this.shadowRoot?.querySelector<HTMLElement>('.md-item-btn');
                  target?.focus();
                }, 0);
              }}
            >
              ${renderEmrSvgIcon('arrow-left', 16)}
              <span>${this.labels.backToList ?? 'Back to list'}</span>
            </button>
          </div>

          <slot name="detail"></slot>

          ${selected
            ? html`
                <article class="emr-stack">
                  <header class="ws-row" style="justify-content:space-between;align-items:flex-start">
                    <div>
                      <h4 class="emr-title">${selected.title}</h4>
                      ${selected.subtitle ? html`<p class="emr-muted">${selected.subtitle}</p>` : nothing}
                    </div>
                    <div class="ws-row">
                      ${selected.priorityBadge
                        ? html`<span class="ws-pill-badge" data-tone=${selected.priorityBadge.tone}>${selected.priorityBadge.label}</span>`
                        : nothing}
                      ${selected.statusBadge
                        ? html`<span class="ws-pill-badge" data-tone=${selected.statusBadge.tone}>${selected.statusBadge.label}</span>`
                        : nothing}
                    </div>
                  </header>

                  ${selected.summaryFields?.length
                    ? html`
                        <dl class="ws-row">
                          ${selected.summaryFields.map(
                            (f) => html`<div><dt class="emr-muted">${f.label}</dt><dd style="margin:0"><strong>${f.value}</strong></dd></div>`,
                          )}
                        </dl>
                      `
                    : nothing}

                  ${selected.detailBody ? html`<p style="margin:0">${selected.detailBody}</p>` : nothing}

                  ${selected.actions?.length && !m.readOnly
                    ? html`
                        <footer class="ws-row" data-emr-print="hide">
                          ${selected.actions.map(
                            (act) => html`
                              <button
                                type="button"
                                class="ws-chip"
                                aria-pressed=${act.primary ? 'true' : nothing}
                                @click=${() => {
                                  if (canMutateMasterDetail(m)) {
                                    this.send({
                                      type: 'actionTriggered',
                                      actionId: act.id,
                                      itemIds: [selected.id],
                                    });
                                  }
                                }}
                              >${act.label}</button>
                            `,
                          )}
                        </footer>
                      `
                    : nothing}
                </article>
              `
            : html`<p role="status" class="emr-muted">
                ${m.emptyDetailMessage ?? this.labels.emptyDetailMessage ?? 'Select an item from the list to inspect details.'}
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

  @property({ type: String }) idPrefix = '';
  @property({ attribute: false }) labels: Partial<EmrSynchronizedTimeGridLabels> = {};

  private stepScroll(delta: -1 | 1): void {
    const m = this.model;
    if (!m || m.readOnly) return;
    if (!canStepTimeGridScroll(m.scrollOffset, m.columns.length, m.visibleColumnCount, delta)) return;
    const count = m.visibleColumnCount ?? m.columns.length;
    const offset = clampTimeGridScrollOffset(m.scrollOffset + delta, m.columns.length, count);
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
    const visibleColumns = resolveTimeGridVisibleColumns(m.columns, m.scrollOffset, m.visibleColumnCount);
    const canEarlier = !m.readOnly && canStepTimeGridScroll(m.scrollOffset, m.columns.length, m.visibleColumnCount, -1);
    const canLater = !m.readOnly && canStepTimeGridScroll(m.scrollOffset, m.columns.length, m.visibleColumnCount, 1);
    const rootId = resolveSynchronizedTimeGridId(m.id, this.idPrefix);
    const resolvedHeadingId = resolveSynchronizedTimeGridHeadingId(m.id, this.idPrefix, this.headingId);

    return html`
      <section
        class="ws-card"
        id=${rootId}
        aria-labelledby=${resolvedHeadingId}
      >
        <header class="ws-toolbar">
          <div>
            <h3 id=${resolvedHeadingId} class="emr-title">${m.title}</h3>
            ${m.subtitle ? html`<p class="emr-muted">${m.subtitle}</p>` : nothing}
          </div>

          <div class="ws-row stg-controls" data-emr-print="hide">
            <div class="ws-row" role="group" aria-label=${this.labels.resolutionGroupLabel ?? 'Time resolution zoom'}>
              ${resolutions.map(
                (res) => html`
                  <button
                    type="button"
                    class="ws-chip"
                    aria-pressed=${m.resolution === res ? 'true' : 'false'}
                    aria-disabled=${m.readOnly ? 'true' : nothing}
                    @click=${() => {
                      if (!m.readOnly) this.send({ type: 'resolutionChanged', resolution: res });
                    }}
                  >${res}</button>
                `,
              )}
            </div>

            <div class="ws-row" role="group" aria-label=${this.labels.scrollGroupLabel ?? 'Time window scroll'}>
              <button
                type="button"
                class="ws-chip"
                aria-label="Scroll earlier"
                aria-disabled=${!canEarlier ? 'true' : nothing}
                @click=${() => this.stepScroll(-1)}
              >
                ${renderEmrSvgIcon('chevron-left', 16)}
                <span>${this.labels.earlier ?? 'Earlier'}</span>
              </button>
              <span class="emr-muted">Col +${m.scrollOffset}</span>
              <button
                type="button"
                class="ws-chip"
                aria-label="Scroll later"
                aria-disabled=${!canLater ? 'true' : nothing}
                @click=${() => this.stepScroll(1)}
              >
                <span>${this.labels.later ?? 'Later'}</span>
                ${renderEmrSvgIcon('chevron-right', 16)}
              </button>
            </div>
          </div>
        </header>

        <div class="stg-scroll" data-emr-print="expand">
          <div class="stg-grid" style=${`--emr-stg-cols:${visibleColumns.length}`}>
            <div class="stg-axis">
              <div class="stg-lead">
                <strong>${this.labels.timeAxisPrefix ?? 'Time Axis'} (${m.resolution})</strong>
              </div>
              ${visibleColumns.map(
                (col) => html`
                  <button
                    type="button"
                    class="stg-col-head"
                    aria-pressed=${col.id === m.selectedColumnId ? 'true' : 'false'}
                    data-current=${col.isCurrentTime ? 'true' : 'false'}
                    aria-disabled=${m.readOnly ? 'true' : nothing}
                    @click=${() => {
                      if (!m.readOnly) this.send({ type: 'columnSelected', columnId: col.id });
                    }}
                  >
                    <strong>${col.label}</strong>
                    ${col.shiftBadge ? html`<small class="emr-muted">${col.shiftBadge}</small>` : nothing}
                    ${col.encounterBadge ? html`<small class="emr-muted">${col.encounterBadge}</small>` : nothing}
                    ${col.isCurrentTime ? html`<strong style="color:var(--emr-primary)">${this.labels.nowBadge ?? 'NOW'}</strong>` : nothing}
                  </button>
                `,
              )}
            </div>

            ${m.tracks.map(
              (track) => html`
                <section aria-label=${track.title}>
                  <header class="stg-track-head">
                    <button
                      type="button"
                      class="stg-track-toggle"
                      aria-expanded=${!track.collapsed ? 'true' : 'false'}
                      @click=${() => this.toggleTrack(track)}
                    >
                      <span class="stg-track-label-group">
                        ${renderEmrSvgIcon(track.collapsed ? 'chevron-right' : 'chevron-down', 16)}
                        <span>${track.title}</span>
                        ${track.badge
                          ? html`<span class="ws-pill-badge" data-tone=${track.badge.tone}>${track.badge.label}</span>`
                          : nothing}
                      </span>
                      <span class="emr-muted">${track.kind.toUpperCase()}</span>
                    </button>
                  </header>

                  <div class="stg-track-rows" data-collapsed=${track.collapsed ? 'true' : 'false'}>
                    ${track.rows.map(
                      (row) => html`
                        <div class="stg-row">
                          <div class="stg-lead">
                            <strong>${row.label}</strong>
                            ${row.unitLabel ? html`<small class="emr-muted">${row.unitLabel}</small>` : nothing}
                            ${row.referenceRangeLabel
                              ? html`<small class="emr-muted">${row.referenceRangeLabel}</small>`
                              : nothing}
                          </div>

                          ${visibleColumns.map((col) => {
                            const cell = row.cells[col.id];
                            const selected =
                              m.selectedCell?.trackId === track.id &&
                              m.selectedCell?.rowId === row.id &&
                              m.selectedCell?.columnId === col.id;
                            const spark = clampSparkNorm(cell?.sparklineNorm);
                            return html`
                              <button
                                type="button"
                                class="stg-cell"
                                aria-pressed=${selected ? 'true' : 'false'}
                                aria-label=${`${row.label}, ${col.label}: ${cell ? cell.valueLabel : 'Empty'}`}
                                data-tone=${cell?.abnormalTone ?? nothing}
                                title=${cell?.note ?? nothing}
                                aria-disabled=${m.readOnly ? 'true' : nothing}
                                @click=${() => this.selectCell(track.id, row.id, col.id, cell)}
                              >
                                ${cell
                                  ? html`
                                      <strong>${cell.valueLabel}</strong>
                                      ${cell.secondaryLabel ? html`<small class="emr-muted">${cell.secondaryLabel}</small>` : nothing}
                                      ${cell.badge
                                        ? html`<span class="ws-pill-badge" data-tone=${cell.badge.tone}>${cell.badge.label}</span>`
                                        : nothing}
                                      ${spark !== null
                                        ? html`
                                            <span class="stg-spark" aria-hidden="true">
                                              <span
                                                class="stg-spark-fill"
                                                data-tone=${cell.abnormalTone ?? 'neutral'}
                                                style=${`width:${Math.round(spark * 100)}%`}
                                              ></span>
                                            </span>
                                          `
                                        : nothing}
                                      ${cell.note ? html`<span class="stg-note">${cell.note}</span>` : nothing}
                                    `
                                  : html`<span class="emr-muted">—</span>`}
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
