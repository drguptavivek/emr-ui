import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
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
  EmrTimeGridColumn,
  EmrTimeGridResolution,
  EmrTimeGridTrack,
} from '@drguptavivek/emr-controller';

// ---------------------------------------------------------------------------
// Pure helper functions (kept local so Angular SSR bundles have zero runtime
// imports from @drguptavivek/emr-controller)
// ---------------------------------------------------------------------------

export const SPLIT_WORKSPACE_PRESET_OPTIONS: readonly {
  readonly id: EmrSplitWorkspacePreset;
  readonly label: string;
}[] = [
  { id: '2-pane-50-50', label: '50 / 50' },
  { id: '2-pane-40-60', label: '40 / 60' },
  { id: '3-pane', label: '3-Pane' },
  { id: 'focus-primary', label: 'Focus Primary' },
];

export const COMMAND_PALETTE_CATEGORIES: readonly {
  readonly id: EmrCommandCategory;
  readonly label: string;
}[] = [
  { id: 'all', label: 'All' },
  { id: 'orders', label: 'Orders' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'smartphrases', label: 'SmartPhrases' },
  { id: 'calculators', label: 'Calculators' },
  { id: 'actions', label: 'Actions' },
];

export const TIME_GRID_RESOLUTION_OPTIONS: readonly {
  readonly id: EmrTimeGridResolution;
  readonly label: string;
}[] = [
  { id: '15m', label: '15m' },
  { id: '1h', label: '1h' },
  { id: '4h', label: '4h' },
  { id: '24h', label: '24h' },
];

export function resolveSplitWorkspacePresetSizes(
  preset: EmrSplitWorkspacePreset,
  paneCount = 3,
): readonly number[] {
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

export function stepSplitWorkspacePaneSizes(
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

export function filterCommandPaletteItems(
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

export function groupCommandPaletteItems(
  filteredItems: readonly EmrCommandItem[],
): readonly EmrCommandGroup[] {
  const groups: { label: string; items: { item: EmrCommandItem; flatIndex: number }[] }[] = [];
  const byLabel = new Map<string, { item: EmrCommandItem; flatIndex: number }[]>();

  filteredItems.forEach((item, flatIndex) => {
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

export function stepCommandPaletteIndex(
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

export function filterMasterDetailItems(
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

export function toggleMasterDetailCheckedId(
  checkedIds: readonly string[],
  itemId: string,
): readonly string[] {
  return checkedIds.includes(itemId)
    ? checkedIds.filter((id) => id !== itemId)
    : [...checkedIds, itemId];
}

export function clampTimeGridScrollOffset(
  offset: number,
  totalColumns: number,
  visibleColumnCount = 6,
): number {
  const maxOffset = Math.max(0, totalColumns - Math.max(1, visibleColumnCount));
  return Math.max(0, Math.min(maxOffset, Math.round(offset)));
}

// ===========================================================================
// 1. EmrSplitWorkspaceComponent (`emr-split-workspace`)
// ===========================================================================

@Component({
  selector: 'emr-split-workspace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <section
      class="emr-split-ws"
      [attr.aria-label]="headingId() ? null : (m.title ?? 'Clinical Split Workstation')"
      [attr.aria-labelledby]="headingId() ?? null"
      [attr.data-preset]="m.preset"
    >
      <header class="emr-split-ws__toolbar">
        <div class="emr-split-ws__title-group">
          <span class="emr-split-ws__tag">WORKSTATION</span>
          <h3 class="emr-split-ws__title" [attr.id]="headingId() ?? null">
            {{ m.title ?? 'Clinical Encounter Split Workspace' }}
          </h3>
        </div>

        <div class="emr-split-ws__presets" role="group" aria-label="Workspace layout presets">
          @for (preset of presets; track preset.id) {
            <button
              type="button"
              class="emr-split-ws__chip"
              [attr.aria-pressed]="m.preset === preset.id"
              [disabled]="!!m.readOnly"
              (click)="selectPreset(preset.id)"
            >{{ preset.label }}</button>
          }
        </div>

        <div class="emr-split-ws__mobile-tabs" role="tablist" aria-label="Mobile workspace panes">
          @for (pane of m.panes; track pane.id) {
            <button
              type="button"
              role="tab"
              class="emr-split-ws__tab"
              [attr.aria-selected]="activeMobilePaneId() === pane.id"
              (click)="selectMobilePane(pane.id)"
            >{{ pane.title }}</button>
          }
        </div>
      </header>

      <div class="emr-split-ws__panes">
        @for (pane of visiblePanes(); track pane.id; let idx = $index) {
          <article
            class="emr-split-ws__pane"
            [class.emr-split-ws__pane--collapsed]="pane.collapsed"
            [class.emr-split-ws__pane--mobile-active]="activeMobilePaneId() === pane.id"
            [style.flex-basis.%]="paneWidthPct(idx, pane)"
            [attr.aria-label]="pane.title"
          >
            <header class="emr-split-ws__pane-head">
              <div class="emr-split-ws__pane-titles">
                <h4 class="emr-split-ws__pane-title">{{ pane.title }}</h4>
                @if (pane.subtitle) {
                  <span class="emr-split-ws__pane-sub">{{ pane.subtitle }}</span>
                }
                @if (pane.badge) {
                  <span class="emr-split-ws__badge" [attr.data-tone]="pane.badge.tone">
                    {{ pane.badge.label }}
                  </span>
                }
              </div>
              @if (pane.collapsible !== false && !m.readOnly) {
                <button
                  type="button"
                  class="emr-split-ws__collapse-btn"
                  [attr.aria-expanded]="!pane.collapsed"
                  [attr.aria-label]="(pane.collapsed ? 'Expand ' : 'Collapse ') + pane.title"
                  (click)="togglePaneCollapse(pane)"
                >{{ pane.collapsed ? 'Expand' : 'Collapse' }}</button>
              }
            </header>

            <div class="emr-split-ws__pane-body" [attr.data-collapsed]="pane.collapsed ? 'true' : null">
              @if (pane.slot === 'pane-primary') {
                <ng-content select="[slot=pane-primary]" />
              } @else if (pane.slot === 'pane-secondary') {
                <ng-content select="[slot=pane-secondary]" />
              } @else {
                <ng-content select="[slot=pane-tertiary]" />
              }

              @if (pane.summaryItems?.length) {
                <ul class="emr-split-ws__summary">
                  @for (line of pane.summaryItems!; track line) {
                    <li>{{ line }}</li>
                  }
                </ul>
              }
            </div>
          </article>

          @if (idx < visiblePanes().length - 1 && !m.readOnly) {
            <div
              class="emr-split-ws__divider"
              role="separator"
              tabindex="0"
              aria-orientation="vertical"
              [attr.aria-label]="'Resize divider ' + (idx + 1)"
              [attr.aria-valuenow]="paneWidthPct(idx, pane)"
              (keydown)="onDividerKeydown(idx, $event)"
            >
              <button
                type="button"
                class="emr-split-ws__step-btn"
                [attr.aria-label]="'Shrink ' + pane.title + ' by 5%'"
                (click)="resizeDivider(idx, -5)"
              >‹</button>
              <span class="emr-split-ws__grip" aria-hidden="true">⋮</span>
              <button
                type="button"
                class="emr-split-ws__step-btn"
                [attr.aria-label]="'Grow ' + pane.title + ' by 5%'"
                (click)="resizeDivider(idx, 5)"
              >›</button>
            </div>
          }
        }
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-split-ws { border: 1px solid var(--emr-border); border-radius: 12px; background: var(--emr-surface); overflow: hidden; }
    .emr-split-ws__toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--emr-border); background: var(--emr-surface-soft); }
    .emr-split-ws__title-group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .emr-split-ws__tag { padding: 3px 8px; border-radius: 6px; background: var(--emr-primary); color: var(--emr-surface); font-family: var(--emr-font-mono); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); }
    .emr-split-ws__title { margin: 0; font-size: var(--emr-text-md); font-weight: var(--emr-weight-bold); }
    .emr-split-ws__presets, .emr-split-ws__mobile-tabs { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .emr-split-ws__chip, .emr-split-ws__tab, .emr-split-ws__collapse-btn, .emr-split-ws__step-btn { min-height: var(--emr-compact-height); padding: 4px 10px; border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); font: inherit; font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); cursor: pointer; }
    .emr-split-ws__chip[aria-pressed="true"], .emr-split-ws__tab[aria-selected="true"] { border-color: var(--emr-primary); background: var(--emr-primary-soft); color: var(--emr-primary-contrast); }
    .emr-split-ws__panes { display: flex; align-items: stretch; min-height: 280px; }
    .emr-split-ws__pane { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; background: var(--emr-surface); }
    .emr-split-ws__pane--collapsed { flex: 0 0 56px !important; }
    .emr-split-ws__pane-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--emr-border); background: var(--emr-surface-raised); }
    .emr-split-ws__pane-titles { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 0; }
    .emr-split-ws__pane-title { margin: 0; font-size: var(--emr-text-sm); font-weight: var(--emr-weight-bold); }
    .emr-split-ws__pane-sub { color: var(--emr-text-muted); font-size: var(--emr-text-xs); }
    .emr-split-ws__badge { padding: 2px 8px; border-radius: 999px; background: var(--emr-info-soft); color: var(--emr-info); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); }
    .emr-split-ws__pane-body { padding: 12px; flex: 1; overflow: auto; }
    .emr-split-ws__pane-body[data-collapsed="true"] { display: none; }
    .emr-split-ws__summary { margin: 0; padding-inline-start: 18px; display: grid; gap: 4px; font-size: var(--emr-text-sm); }
    .emr-split-ws__divider { flex: 0 0 28px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; background: var(--emr-surface-soft); border-inline: 1px solid var(--emr-border); cursor: col-resize; }
    .emr-split-ws__divider:focus-visible { outline: 3px solid var(--emr-focus); outline-offset: -2px; }
    .emr-split-ws__step-btn { padding: 2px 5px; min-height: 22px; }
    .emr-split-ws__grip { color: var(--emr-text-muted); font-size: var(--emr-text-sm); }
    @media (max-width: 720px) {
      .emr-split-ws__panes { flex-direction: column; }
      .emr-split-ws__divider { display: none; }
      .emr-split-ws__pane:not(.emr-split-ws__pane--mobile-active) { display: none; }
    }
    @media print {
      .emr-split-ws__presets, .emr-split-ws__mobile-tabs, .emr-split-ws__divider, .emr-split-ws__collapse-btn { display: none !important; }
      .emr-split-ws__panes { display: block; }
      .emr-split-ws__pane, .emr-split-ws__pane--collapsed { display: block !important; width: 100% !important; break-inside: avoid; margin-bottom: 12px; }
      .emr-split-ws__pane-body, .emr-split-ws__pane-body[data-collapsed="true"] { display: block !important; overflow: visible !important; }
    }
    :host-context(.emr-print) .emr-split-ws__presets,
    :host-context(.emr-print) .emr-split-ws__mobile-tabs,
    :host-context(.emr-print) .emr-split-ws__divider,
    :host-context(.emr-print) .emr-split-ws__collapse-btn { display: none !important; }
    :host-context(.emr-print) .emr-split-ws__panes { display: block; }
    :host-context(.emr-print) .emr-split-ws__pane,
    :host-context(.emr-print) .emr-split-ws__pane--collapsed { display: block !important; width: 100% !important; break-inside: avoid; margin-bottom: 12px; }
    :host-context(.emr-print) .emr-split-ws__pane-body,
    :host-context(.emr-print) .emr-split-ws__pane-body[data-collapsed="true"] { display: block !important; overflow: visible !important; }
  `],
})
export class EmrSplitWorkspaceComponent {
  readonly model = input.required<EmrSplitWorkspaceViewModel>();
  readonly headingId = input<string>();
  readonly intent = output<EmrSplitWorkspaceIntent>();

  protected readonly presets = SPLIT_WORKSPACE_PRESET_OPTIONS;

  visiblePanes(): readonly EmrSplitWorkspacePane[] {
    const m = this.model();
    if (m.preset === '3-pane') return m.panes.slice(0, 3);
    return m.panes.slice(0, 2);
  }

  activeMobilePaneId(): string {
    const m = this.model();
    return m.mobileActivePaneId ?? m.panes[0]?.id ?? '';
  }

  paneWidthPct(index: number, pane: EmrSplitWorkspacePane): number {
    if (pane.collapsed) return 6;
    const sizes = this.model().paneSizes;
    return sizes[index] ?? Math.round(100 / Math.max(1, this.visiblePanes().length));
  }

  selectPreset(preset: EmrSplitWorkspacePreset): void {
    const m = this.model();
    if (m.readOnly) return;
    const targetCount = preset === '3-pane' ? Math.min(3, m.panes.length) : Math.min(2, m.panes.length);
    const paneSizes = resolveSplitWorkspacePresetSizes(preset, targetCount);
    this.intent.emit({ type: 'presetChanged', preset, paneSizes });
  }

  resizeDivider(dividerIndex: number, deltaPct: number): void {
    const m = this.model();
    if (m.readOnly) return;
    const paneSizes = stepSplitWorkspacePaneSizes(m.paneSizes, dividerIndex, deltaPct);
    this.intent.emit({ type: 'paneResized', dividerIndex, deltaPct, paneSizes });
  }

  onDividerKeydown(dividerIndex: number, event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.resizeDivider(dividerIndex, -5);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.resizeDivider(dividerIndex, 5);
    }
  }

  togglePaneCollapse(pane: EmrSplitWorkspacePane): void {
    if (this.model().readOnly) return;
    this.intent.emit({
      type: 'paneCollapsedToggled',
      paneId: pane.id,
      collapsed: !pane.collapsed,
    });
  }

  selectMobilePane(paneId: string): void {
    this.intent.emit({ type: 'mobilePaneSelected', paneId });
  }
}

// ===========================================================================
// 2. EmrCommandPaletteComponent (`emr-command-palette`)
// ===========================================================================

@Component({
  selector: 'emr-command-palette',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    @if (m.open) {
      <div class="emr-cmd-backdrop" (click)="dismiss()">
        <section
          class="emr-cmd"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="headingId() ? null : (m.title ?? 'Clinical Command Palette')"
          [attr.aria-labelledby]="headingId() ?? null"
          (click)="$event.stopPropagation()"
          (keydown)="onKeydown($event)"
        >
          <header class="emr-cmd__head">
            <div class="emr-cmd__title-row">
              <span class="emr-cmd__kbd">⌘K</span>
              <h3 class="emr-cmd__title" [attr.id]="headingId() ?? null">
                {{ m.title ?? 'Quick Orders, SmartPhrases & Navigation' }}
              </h3>
              <button
                type="button"
                class="emr-cmd__close"
                aria-label="Close command palette (Escape)"
                (click)="dismiss()"
              >Esc ✕</button>
            </div>

            <input
              type="search"
              class="emr-cmd__input"
              [value]="m.query"
              [placeholder]="m.placeholder ?? 'Type a command, order, SmartPhrase (.iop), or patient route...'"
              aria-label="Search clinical commands"
              (input)="onQueryInput($event)"
            />

            <div class="emr-cmd__categories" role="tablist" aria-label="Command categories">
              @for (cat of categories; track cat.id) {
                <button
                  type="button"
                  role="tab"
                  class="emr-cmd__cat-pill"
                  [attr.aria-selected]="m.activeCategory === cat.id"
                  (click)="selectCategory(cat.id)"
                >{{ cat.label }}</button>
              }
            </div>
          </header>

          <div class="emr-cmd__body" role="listbox" aria-label="Matching clinical commands">
            @if (!filteredItems().length) {
              <p class="emr-cmd__empty" role="status">
                {{ m.emptyMessage ?? 'No matching commands, orders, or SmartPhrases.' }}
              </p>
            } @else {
              @for (group of groupedItems(); track group.label) {
                <div class="emr-cmd__group">
                  <div class="emr-cmd__group-label">{{ group.label }}</div>
                  @for (entry of group.items; track entry.item.id) {
                    <button
                      type="button"
                      role="option"
                      class="emr-cmd__item"
                      [class.emr-cmd__item--active]="entry.flatIndex === m.activeIndex"
                      [attr.aria-selected]="entry.flatIndex === m.activeIndex"
                      [disabled]="!!entry.item.disabled || !!m.readOnly"
                      (mouseenter)="highlightItem(entry.flatIndex, entry.item)"
                      (click)="executeItem(entry.item)"
                    >
                      <div class="emr-cmd__item-main">
                        <span class="emr-cmd__item-label">{{ entry.item.label }}</span>
                        @if (entry.item.subtitle) {
                          <span class="emr-cmd__item-sub">{{ entry.item.subtitle }}</span>
                        }
                      </div>
                      <div class="emr-cmd__item-meta">
                        @if (entry.item.pinned) {
                          <span class="emr-cmd__pin">★ Pinned</span>
                        } @else if (entry.item.recent) {
                          <span class="emr-cmd__recent">Recent</span>
                        }
                        @if (entry.item.badge) {
                          <span class="emr-cmd__badge">{{ entry.item.badge.label }}</span>
                        }
                        @if (entry.item.shortcut) {
                          <kbd class="emr-cmd__shortcut">{{ entry.item.shortcut }}</kbd>
                        }
                      </div>
                    </button>
                  }
                </div>
              }
            }
          </div>
        </section>
      </div>
    }
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-cmd-backdrop { padding: 16px; border-radius: 12px; background: var(--emr-surface-accent); }
    .emr-cmd { max-width: 680px; margin: 0 auto; border: 1px solid var(--emr-border); border-radius: 12px; background: var(--emr-surface); box-shadow: var(--emr-shadow); overflow: hidden; }
    .emr-cmd__head { padding: 12px 14px; border-bottom: 1px solid var(--emr-border); background: var(--emr-surface-soft); display: grid; gap: 10px; }
    .emr-cmd__title-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .emr-cmd__kbd, .emr-cmd__shortcut { padding: 2px 7px; border: 1px solid var(--emr-border); border-radius: 5px; background: var(--emr-surface-raised); color: var(--emr-text); font-family: var(--emr-font-mono); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); }
    .emr-cmd__title { margin: 0; flex: 1; font-size: var(--emr-text-md); font-weight: var(--emr-weight-bold); }
    .emr-cmd__close { min-height: var(--emr-compact-height); padding: 4px 10px; border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text-muted); font: inherit; font-size: var(--emr-text-xs); cursor: pointer; }
    .emr-cmd__input { width: 100%; min-height: var(--emr-control-height); padding: 8px 12px; border: 1px solid var(--emr-border); border-radius: 8px; background: var(--emr-surface); color: var(--emr-text); font: inherit; font-size: var(--emr-text-md); }
    .emr-cmd__input:focus-visible { outline: 3px solid var(--emr-focus); outline-offset: 2px; }
    .emr-cmd__categories { display: flex; flex-wrap: wrap; gap: 6px; }
    .emr-cmd__cat-pill { min-height: var(--emr-compact-height); padding: 4px 10px; border: 1px solid var(--emr-border); border-radius: 999px; background: var(--emr-surface); color: var(--emr-text); font: inherit; font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); cursor: pointer; }
    .emr-cmd__cat-pill[aria-selected="true"] { border-color: var(--emr-primary); background: var(--emr-primary-soft); color: var(--emr-primary-contrast); }
    .emr-cmd__body { max-height: 360px; overflow-y: auto; padding: 8px; display: grid; gap: 10px; }
    .emr-cmd__empty { margin: 16px; text-align: center; color: var(--emr-text-muted); font-size: var(--emr-text-sm); }
    .emr-cmd__group { display: grid; gap: 4px; }
    .emr-cmd__group-label { padding: 2px 8px; color: var(--emr-text-muted); font-family: var(--emr-font-mono); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); text-transform: uppercase; }
    .emr-cmd__item { width: 100%; min-height: var(--emr-control-height); padding: 8px 10px; border: 1px solid transparent; border-radius: 8px; background: transparent; color: var(--emr-text); display: flex; align-items: center; justify-content: space-between; gap: 12px; text-align: start; font: inherit; cursor: pointer; }
    .emr-cmd__item--active, .emr-cmd__item:hover:not(:disabled) { border-color: var(--emr-primary-border); background: var(--emr-primary-soft); }
    .emr-cmd__item:disabled { opacity: 0.5; cursor: not-allowed; }
    .emr-cmd__item-main { display: grid; gap: 2px; min-width: 0; }
    .emr-cmd__item-label { font-size: var(--emr-text-sm); font-weight: var(--emr-weight-bold); }
    .emr-cmd__item-sub { color: var(--emr-text-muted); font-size: var(--emr-text-xs); }
    .emr-cmd__item-meta { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .emr-cmd__pin { color: var(--emr-warning); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); }
    .emr-cmd__recent { color: var(--emr-info); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); }
    .emr-cmd__badge { padding: 2px 7px; border-radius: 999px; background: var(--emr-info-soft); color: var(--emr-info); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); }
  `],
})
export class EmrCommandPaletteComponent {
  readonly model = input.required<EmrCommandPaletteViewModel>();
  readonly headingId = input<string>();
  readonly intent = output<EmrCommandPaletteIntent>();

  protected readonly categories = COMMAND_PALETTE_CATEGORIES;

  filteredItems(): readonly EmrCommandItem[] {
    const m = this.model();
    return filterCommandPaletteItems(m.items, m.activeCategory, m.query);
  }

  groupedItems(): readonly EmrCommandGroup[] {
    return groupCommandPaletteItems(this.filteredItems());
  }

  onQueryInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.intent.emit({ type: 'queryChanged', query });
  }

  selectCategory(category: EmrCommandCategory): void {
    this.intent.emit({ type: 'categoryChanged', category });
  }

  highlightItem(index: number, item: EmrCommandItem): void {
    if (item.disabled) return;
    this.intent.emit({ type: 'itemHighlighted', index, itemId: item.id });
  }

  executeItem(item: EmrCommandItem): void {
    if (item.disabled || this.model().readOnly) return;
    this.intent.emit({ type: 'commandExecuted', itemId: item.id, item });
  }

  dismiss(): void {
    this.intent.emit({ type: 'dismissed' });
  }

  onKeydown(event: KeyboardEvent): void {
    const items = this.filteredItems();
    const m = this.model();
    if (event.key === 'Escape') {
      event.preventDefault();
      this.dismiss();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = stepCommandPaletteIndex(items, m.activeIndex, delta);
      const nextItem = items[nextIndex];
      if (nextIndex >= 0 && nextItem) {
        this.intent.emit({ type: 'itemHighlighted', index: nextIndex, itemId: nextItem.id });
      }
      return;
    }
    if (event.key === 'Enter') {
      const current = items[m.activeIndex];
      if (current && !current.disabled && !m.readOnly) {
        event.preventDefault();
        this.executeItem(current);
      }
    }
  }
}

// ===========================================================================
// 3. EmrMasterDetailComponent (`emr-master-detail`)
// ===========================================================================

@Component({
  selector: 'emr-master-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <section
      class="emr-md"
      [attr.aria-label]="headingId() ? null : m.title"
      [attr.aria-labelledby]="headingId() ?? null"
      [attr.data-mobile-detail]="m.mobileDetailOpen ? 'open' : 'closed'"
    >
      <div class="emr-md__master">
        <header class="emr-md__master-head">
          <div class="emr-md__title-row">
            <div>
              <h3 class="emr-md__title" [attr.id]="headingId() ?? null">{{ m.title }}</h3>
              @if (m.subtitle) {
                <p class="emr-md__subtitle">{{ m.subtitle }}</p>
              }
            </div>
            @if (m.batchActions?.length && (m.checkedIds?.length ?? 0) > 0 && !m.readOnly) {
              <div class="emr-md__batch-bar">
                @for (act of m.batchActions!; track act.id) {
                  <button
                    type="button"
                    class="emr-md__btn"
                    (click)="triggerAction(act.id, m.checkedIds!)"
                  >{{ act.label }} ({{ m.checkedIds!.length }})</button>
                }
              </div>
            }
          </div>

          <input
            type="search"
            class="emr-md__search"
            [value]="m.searchQuery"
            [placeholder]="m.searchPlaceholder ?? 'Filter work queue or inbox items...'"
            aria-label="Search master list"
            (input)="onSearchInput($event)"
          />

          @if (m.filters.length) {
            <div class="emr-md__filters" role="tablist" aria-label="List filters">
              @for (f of m.filters; track f.id) {
                <button
                  type="button"
                  role="tab"
                  class="emr-md__filter-pill"
                  [attr.aria-selected]="m.activeFilterId === f.id"
                  (click)="selectFilter(f.id)"
                >
                  {{ f.label }}
                  @if (f.count !== undefined) {
                    <span class="emr-md__filter-count">{{ f.count }}</span>
                  }
                </button>
              }
            </div>
          }
        </header>

        <div class="emr-md__list" role="listbox" [attr.aria-label]="m.title + ' items'">
          <ng-content select="[slot=master]" />

          @if (!filteredItems().length) {
            <p class="emr-md__empty" role="status">
              {{ m.emptyListMessage ?? 'No matching queue items.' }}
            </p>
          } @else {
            @for (item of filteredItems(); track item.id) {
              <div
                class="emr-md__row"
                role="option"
                [class.emr-md__row--selected]="item.id === m.selectedId"
                [class.emr-md__row--unread]="item.unread"
                [attr.aria-selected]="item.id === m.selectedId"
              >
                @if (!m.readOnly) {
                  <input
                    type="checkbox"
                    class="emr-md__checkbox"
                    [checked]="isChecked(item.id)"
                    [attr.aria-label]="'Select ' + item.title"
                    (change)="toggleBatchItem(item.id)"
                  />
                }
                <button
                  type="button"
                  class="emr-md__row-btn"
                  (click)="selectItem(item.id)"
                >
                  <div class="emr-md__row-top">
                    <span class="emr-md__row-title">
                      @if (item.unread) {
                        <span class="emr-md__unread-dot" aria-label="Unread">●</span>
                      }
                      {{ item.title }}
                    </span>
                    @if (item.timestampLabel) {
                      <span class="emr-md__time">{{ item.timestampLabel }}</span>
                    }
                  </div>
                  @if (item.subtitle) {
                    <span class="emr-md__row-sub">{{ item.subtitle }}</span>
                  }
                  <div class="emr-md__badges">
                    @if (item.priorityBadge) {
                      <span class="emr-md__badge" [attr.data-tone]="item.priorityBadge.tone">
                        {{ item.priorityBadge.label }}
                      </span>
                    }
                    @if (item.statusBadge) {
                      <span class="emr-md__badge" [attr.data-tone]="item.statusBadge.tone">
                        {{ item.statusBadge.label }}
                      </span>
                    }
                  </div>
                </button>
              </div>
            }
          }
        </div>
      </div>

      <aside class="emr-md__detail" aria-label="Selected item detail inspector">
        <div class="emr-md__mobile-bar">
          <button
            type="button"
            class="emr-md__btn"
            aria-label="Back to master list"
            (click)="closeDetail()"
          >← Back to list</button>
        </div>

        <ng-content select="[slot=detail]" />

        @if (selectedItem(); as sel) {
          <article class="emr-md__inspector">
            <header class="emr-md__inspector-head">
              <div>
                <h4 class="emr-md__inspector-title">{{ sel.title }}</h4>
                @if (sel.subtitle) {
                  <p class="emr-md__subtitle">{{ sel.subtitle }}</p>
                }
              </div>
              <div class="emr-md__badges">
                @if (sel.priorityBadge) {
                  <span class="emr-md__badge" [attr.data-tone]="sel.priorityBadge.tone">
                    {{ sel.priorityBadge.label }}
                  </span>
                }
                @if (sel.statusBadge) {
                  <span class="emr-md__badge" [attr.data-tone]="sel.statusBadge.tone">
                    {{ sel.statusBadge.label }}
                  </span>
                }
              </div>
            </header>

            @if (sel.summaryFields?.length) {
              <dl class="emr-md__fields">
                @for (f of sel.summaryFields!; track f.label) {
                  <div class="emr-md__field">
                    <dt>{{ f.label }}</dt>
                    <dd>{{ f.value }}</dd>
                  </div>
                }
              </dl>
            }

            @if (sel.detailBody) {
              <p class="emr-md__body">{{ sel.detailBody }}</p>
            }

            @if (sel.actions?.length && !m.readOnly) {
              <footer class="emr-md__actions">
                @for (act of sel.actions!; track act.id) {
                  <button
                    type="button"
                    class="emr-md__btn"
                    [class.emr-md__btn--primary]="act.primary"
                    (click)="triggerAction(act.id, [sel.id])"
                  >{{ act.label }}</button>
                }
              </footer>
            }
          </article>
        } @else {
          <p class="emr-md__empty" role="status">
            {{ m.emptyDetailMessage ?? 'Select an item from the list to inspect details.' }}
          </p>
        }
      </aside>
    </section>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-md { display: grid; grid-template-columns: minmax(280px, 1fr) minmax(0, 1.6fr); border: 1px solid var(--emr-border); border-radius: 12px; background: var(--emr-surface); overflow: hidden; min-height: 340px; }
    .emr-md__master { border-inline-end: 1px solid var(--emr-border); display: flex; flex-direction: column; min-width: 0; }
    .emr-md__master-head { padding: 12px; border-bottom: 1px solid var(--emr-border); background: var(--emr-surface-soft); display: grid; gap: 8px; }
    .emr-md__title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
    .emr-md__title { margin: 0; font-size: var(--emr-text-md); font-weight: var(--emr-weight-bold); }
    .emr-md__subtitle { margin: 2px 0 0; color: var(--emr-text-muted); font-size: var(--emr-text-xs); }
    .emr-md__search { width: 100%; min-height: var(--emr-compact-height); padding: 6px 10px; border: 1px solid var(--emr-border); border-radius: 8px; background: var(--emr-surface); color: var(--emr-text); font: inherit; font-size: var(--emr-text-sm); }
    .emr-md__filters, .emr-md__batch-bar, .emr-md__badges, .emr-md__actions { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .emr-md__filter-pill, .emr-md__btn { min-height: var(--emr-compact-height); padding: 4px 10px; border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); font: inherit; font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); cursor: pointer; display: inline-flex; align-items: center; gap: 5px; }
    .emr-md__filter-pill[aria-selected="true"], .emr-md__btn--primary { border-color: var(--emr-primary); background: var(--emr-primary-soft); color: var(--emr-primary-contrast); }
    .emr-md__filter-count { padding: 1px 6px; border-radius: 999px; background: var(--emr-surface-raised); font-size: var(--emr-text-2xs); }
    .emr-md__list { flex: 1; overflow-y: auto; }
    .emr-md__row { display: flex; align-items: flex-start; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--emr-border); }
    .emr-md__row--selected { background: var(--emr-primary-soft); }
    .emr-md__row-btn { flex: 1; border: 0; padding: 0; background: transparent; color: var(--emr-text); text-align: start; font: inherit; cursor: pointer; display: grid; gap: 4px; min-width: 0; }
    .emr-md__row-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
    .emr-md__row-title { font-size: var(--emr-text-sm); font-weight: var(--emr-weight-bold); }
    .emr-md__unread-dot { color: var(--emr-primary); margin-inline-end: 4px; }
    .emr-md__time, .emr-md__row-sub { color: var(--emr-text-muted); font-size: var(--emr-text-xs); }
    .emr-md__badge { padding: 2px 8px; border-radius: 999px; background: var(--emr-info-soft); color: var(--emr-info); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); }
    .emr-md__badge[data-tone="danger"] { background: var(--emr-danger-soft); color: var(--emr-danger); }
    .emr-md__badge[data-tone="warning"] { background: var(--emr-warning-soft); color: var(--emr-warning); }
    .emr-md__badge[data-tone="success"] { background: var(--emr-success-soft); color: var(--emr-success); }
    .emr-md__detail { padding: 16px; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
    .emr-md__mobile-bar { display: none; }
    .emr-md__inspector { display: grid; gap: 14px; }
    .emr-md__inspector-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--emr-border); }
    .emr-md__inspector-title { margin: 0; font-size: var(--emr-text-lg); }
    .emr-md__fields { margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; padding: 10px; border-radius: 8px; background: var(--emr-surface-soft); }
    .emr-md__field dt { color: var(--emr-text-muted); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); text-transform: uppercase; }
    .emr-md__field dd { margin: 2px 0 0; font-size: var(--emr-text-sm); font-weight: var(--emr-weight-bold); }
    .emr-md__body { margin: 0; font-size: var(--emr-text-sm); line-height: 1.5; white-space: pre-wrap; }
    .emr-md__empty { margin: 16px; color: var(--emr-text-muted); font-size: var(--emr-text-sm); text-align: center; }
    @media (max-width: 720px) {
      .emr-md { grid-template-columns: minmax(0, 1fr); }
      .emr-md__mobile-bar { display: flex; }
      .emr-md[data-mobile-detail="open"] .emr-md__master { display: none; }
      .emr-md[data-mobile-detail="closed"] .emr-md__detail { display: none; }
    }
  `],
})
export class EmrMasterDetailComponent {
  readonly model = input.required<EmrMasterDetailViewModel>();
  readonly headingId = input<string>();
  readonly intent = output<EmrMasterDetailIntent>();

  filteredItems(): readonly EmrMasterDetailItem[] {
    const m = this.model();
    return filterMasterDetailItems(m.items, m.activeFilterId, m.searchQuery);
  }

  selectedItem(): EmrMasterDetailItem | undefined {
    const m = this.model();
    return m.items.find((item) => item.id === m.selectedId);
  }

  isChecked(itemId: string): boolean {
    return (this.model().checkedIds ?? []).includes(itemId);
  }

  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.intent.emit({ type: 'searchChanged', query });
  }

  selectFilter(filterId: string): void {
    this.intent.emit({ type: 'filterChanged', filterId });
  }

  selectItem(itemId: string): void {
    this.intent.emit({ type: 'itemSelected', itemId });
  }

  closeDetail(): void {
    this.intent.emit({ type: 'detailClosed' });
  }

  toggleBatchItem(itemId: string): void {
    if (this.model().readOnly) return;
    const checkedIds = toggleMasterDetailCheckedId(this.model().checkedIds ?? [], itemId);
    this.intent.emit({ type: 'batchSelectionToggled', itemId, checkedIds });
  }

  triggerAction(actionId: string, itemIds: readonly string[]): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'actionTriggered', actionId, itemIds });
  }
}

// ===========================================================================
// 4. EmrSynchronizedTimeGridComponent (`emr-synchronized-time-grid`)
// ===========================================================================

@Component({
  selector: 'emr-synchronized-time-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let m = model();
    <section
      class="emr-stg"
      [attr.aria-label]="headingId() ? null : m.title"
      [attr.aria-labelledby]="headingId() ?? null"
    >
      <header class="emr-stg__toolbar">
        <div>
          <h3 class="emr-stg__title" [attr.id]="headingId() ?? null">{{ m.title }}</h3>
          @if (m.subtitle) {
            <p class="emr-stg__sub">{{ m.subtitle }}</p>
          }
        </div>

        <div class="emr-stg__controls">
          <div class="emr-stg__resolutions" role="group" aria-label="Time resolution zoom">
            @for (res of resolutions(); track res) {
              <button
                type="button"
                class="emr-stg__btn"
                [attr.aria-pressed]="m.resolution === res"
                [disabled]="!!m.readOnly"
                (click)="selectResolution(res)"
              >{{ res }}</button>
            }
          </div>

          <div class="emr-stg__nav" role="group" aria-label="Time window scroll">
            <button
              type="button"
              class="emr-stg__btn"
              aria-label="Scroll earlier"
              [disabled]="!!m.readOnly || m.scrollOffset <= 0"
              (click)="stepScroll(-1)"
            >‹ Earlier</button>
            <span class="emr-stg__offset-label">Col +{{ m.scrollOffset }}</span>
            <button
              type="button"
              class="emr-stg__btn"
              aria-label="Scroll later"
              [disabled]="!!m.readOnly"
              (click)="stepScroll(1)"
            >Later ›</button>
          </div>
        </div>
      </header>

      <div class="emr-stg__scroll-viewport">
        <div class="emr-stg__axis-row" role="row">
          <div class="emr-stg__lead-cell">Time Axis ({{ m.resolution }})</div>
          @for (col of visibleColumns(); track col.id) {
            <button
              type="button"
              class="emr-stg__col-head"
              [class.emr-stg__col-head--current]="col.isCurrentTime"
              [class.emr-stg__col-head--selected]="col.id === m.selectedColumnId"
              [attr.aria-pressed]="col.id === m.selectedColumnId"
              (click)="selectColumn(col.id)"
            >
              <span class="emr-stg__col-label">{{ col.label }}</span>
              @if (col.shiftBadge) {
                <span class="emr-stg__col-sub">{{ col.shiftBadge }}</span>
              }
              @if (col.encounterBadge) {
                <span class="emr-stg__col-enc">{{ col.encounterBadge }}</span>
              }
              @if (col.isCurrentTime) {
                <span class="emr-stg__now">NOW</span>
              }
            </button>
          }
        </div>

        @for (track of m.tracks; track track.id) {
          <section class="emr-stg__track" [attr.aria-label]="track.title">
            <header class="emr-stg__track-head">
              <button
                type="button"
                class="emr-stg__track-toggle"
                [attr.aria-expanded]="!track.collapsed"
                (click)="toggleTrack(track)"
              >
                <span>{{ track.collapsed ? '▸' : '▾' }} {{ track.title }}</span>
                <span class="emr-stg__track-kind">{{ track.kind.toUpperCase() }}</span>
              </button>
            </header>

            <div class="emr-stg__track-rows" [attr.data-collapsed]="track.collapsed ? 'true' : null">
              @for (row of track.rows; track row.id) {
                <div class="emr-stg__row" role="row">
                  <div class="emr-stg__row-lead" role="rowheader">
                    <span class="emr-stg__row-label">{{ row.label }}</span>
                    @if (row.unitLabel) {
                      <span class="emr-stg__row-unit">{{ row.unitLabel }}</span>
                    }
                    @if (row.referenceRangeLabel) {
                      <span class="emr-stg__row-ref">{{ row.referenceRangeLabel }}</span>
                    }
                  </div>

                  @for (col of visibleColumns(); track col.id) {
                    @let cell = row.cells[col.id];
                    <button
                      type="button"
                      class="emr-stg__cell"
                      [class.emr-stg__cell--selected]="isCellSelected(track.id, row.id, col.id)"
                      [attr.data-tone]="cell?.abnormalTone ?? null"
                      (click)="selectCell(track.id, row.id, col.id, cell)"
                    >
                      @if (cell) {
                        <span class="emr-stg__cell-val">{{ cell.valueLabel }}</span>
                        @if (cell.secondaryLabel) {
                          <span class="emr-stg__cell-sec">{{ cell.secondaryLabel }}</span>
                        }
                        @if (cell.badge) {
                          <span class="emr-stg__cell-badge">{{ cell.badge.label }}</span>
                        }
                      } @else {
                        <span class="emr-stg__cell-empty">—</span>
                      }
                    </button>
                  }
                </div>
              }
            </div>
          </section>
        }
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; color: var(--emr-text); font-family: var(--emr-font-family); }
    .emr-stg { border: 1px solid var(--emr-border); border-radius: 12px; background: var(--emr-surface); overflow: hidden; }
    .emr-stg__toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--emr-border); background: var(--emr-surface-soft); }
    .emr-stg__title { margin: 0; font-size: var(--emr-text-md); font-weight: var(--emr-weight-bold); }
    .emr-stg__sub { margin: 2px 0 0; color: var(--emr-text-muted); font-size: var(--emr-text-xs); }
    .emr-stg__controls, .emr-stg__resolutions, .emr-stg__nav { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .emr-stg__btn { min-height: var(--emr-compact-height); padding: 4px 10px; border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); font: inherit; font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); cursor: pointer; }
    .emr-stg__btn[aria-pressed="true"] { border-color: var(--emr-primary); background: var(--emr-primary-soft); color: var(--emr-primary-contrast); }
    .emr-stg__offset-label { font-family: var(--emr-font-mono); font-size: var(--emr-text-xs); color: var(--emr-text-muted); }
    .emr-stg__scroll-viewport { overflow-x: auto; }
    .emr-stg__axis-row, .emr-stg__row { display: grid; grid-template-columns: 180px repeat(auto-fit, minmax(96px, 1fr)); border-bottom: 1px solid var(--emr-border); }
    .emr-stg__lead-cell, .emr-stg__row-lead { padding: 8px 10px; border-inline-end: 1px solid var(--emr-border); background: var(--emr-surface-raised); display: flex; flex-direction: column; justify-content: center; }
    .emr-stg__lead-cell { font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); color: var(--emr-text-muted); }
    .emr-stg__col-head { padding: 6px 8px; border: 0; border-inline-end: 1px solid var(--emr-border); background: var(--emr-surface-raised); color: var(--emr-text); font: inherit; display: flex; flex-direction: column; align-items: center; gap: 2px; cursor: pointer; }
    .emr-stg__col-head--current, .emr-stg__col-head--selected { background: var(--emr-primary-soft); }
    .emr-stg__col-label { font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); }
    .emr-stg__col-sub, .emr-stg__col-enc { font-size: var(--emr-text-2xs); color: var(--emr-text-muted); }
    .emr-stg__now { font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); color: var(--emr-primary); }
    .emr-stg__track-head { background: var(--emr-surface-accent); border-bottom: 1px solid var(--emr-border); }
    .emr-stg__track-toggle { width: 100%; padding: 6px 12px; border: 0; background: transparent; color: var(--emr-text); font: inherit; font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
    .emr-stg__track-kind { font-family: var(--emr-font-mono); font-size: var(--emr-text-2xs); color: var(--emr-text-muted); }
    .emr-stg__track-rows[data-collapsed="true"] { display: none; }
    .emr-stg__row-label { font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); }
    .emr-stg__row-unit, .emr-stg__row-ref { font-size: var(--emr-text-2xs); color: var(--emr-text-muted); }
    .emr-stg__cell { min-height: 44px; padding: 6px 8px; border: 0; border-inline-end: 1px solid var(--emr-border); background: var(--emr-surface); color: var(--emr-text); font: inherit; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; cursor: pointer; }
    .emr-stg__cell--selected { box-shadow: inset 0 0 0 2px var(--emr-primary); background: var(--emr-primary-soft); }
    .emr-stg__cell[data-tone="danger"] { background: var(--emr-danger-soft); color: var(--emr-danger); }
    .emr-stg__cell[data-tone="warning"] { background: var(--emr-warning-soft); color: var(--emr-warning); }
    .emr-stg__cell-val { font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); }
    .emr-stg__cell-sec, .emr-stg__cell-badge { font-size: var(--emr-text-2xs); color: var(--emr-text-muted); }
    .emr-stg__cell-empty { color: var(--emr-text-muted); font-size: var(--emr-text-xs); }
    @media print {
      .emr-stg__controls { display: none !important; }
      .emr-stg__scroll-viewport { overflow: visible !important; }
      .emr-stg__track-rows[data-collapsed="true"] { display: block !important; }
    }
    :host-context(.emr-print) .emr-stg__controls { display: none !important; }
    :host-context(.emr-print) .emr-stg__scroll-viewport { overflow: visible !important; }
    :host-context(.emr-print) .emr-stg__track-rows[data-collapsed="true"] { display: block !important; }
  `],
})
export class EmrSynchronizedTimeGridComponent {
  readonly model = input.required<EmrSynchronizedTimeGridViewModel>();
  readonly headingId = input<string>();
  readonly intent = output<EmrSynchronizedTimeGridIntent>();

  resolutions(): readonly EmrTimeGridResolution[] {
    return this.model().availableResolutions ?? ['15m', '1h', '4h', '24h'];
  }

  visibleColumns(): readonly EmrTimeGridColumn[] {
    const m = this.model();
    const start = Math.max(0, m.scrollOffset);
    const count = m.visibleColumnCount ?? m.columns.length;
    return m.columns.slice(start, start + count);
  }

  isCellSelected(trackId: string, rowId: string, columnId: string): boolean {
    const sel = this.model().selectedCell;
    return !!sel && sel.trackId === trackId && sel.rowId === rowId && sel.columnId === columnId;
  }

  selectResolution(resolution: EmrTimeGridResolution): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'resolutionChanged', resolution });
  }

  stepScroll(delta: number): void {
    const m = this.model();
    if (m.readOnly) return;
    const offset = clampTimeGridScrollOffset(
      m.scrollOffset + delta,
      m.columns.length,
      m.visibleColumnCount ?? m.columns.length,
    );
    this.intent.emit({ type: 'scrollOffsetChanged', offset });
  }

  selectColumn(columnId: string): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'columnSelected', columnId });
  }

  toggleTrack(track: EmrTimeGridTrack): void {
    this.intent.emit({
      type: 'trackToggled',
      trackId: track.id,
      collapsed: !track.collapsed,
    });
  }

  selectCell(trackId: string, rowId: string, columnId: string, cell?: EmrTimeGridCell): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'cellSelected', trackId, rowId, columnId, cell });
  }
}
