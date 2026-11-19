import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroArrowLeft,
  heroChevronDown,
  heroChevronLeft,
  heroChevronRight,
  heroEllipsisVertical,
  heroXMark,
} from '@ng-icons/heroicons/outline';
import { heroStarSolid } from '@ng-icons/heroicons/solid';
import type {
  EmrCommandCategory,
  EmrCommandGroup,
  EmrCommandItem,
  EmrCommandPaletteIntent,
  EmrCommandPaletteLabels,
  EmrCommandPaletteViewModel,
  EmrMasterDetailIntent,
  EmrMasterDetailItem,
  EmrMasterDetailLabels,
  EmrMasterDetailViewModel,
  EmrSplitWorkspaceIntent,
  EmrSplitWorkspaceLabels,
  EmrSplitWorkspacePane,
  EmrSplitWorkspacePreset,
  EmrSplitWorkspaceViewModel,
  EmrSynchronizedTimeGridIntent,
  EmrSynchronizedTimeGridLabels,
  EmrSynchronizedTimeGridViewModel,
  EmrTimeGridCell,
  EmrTimeGridColumn,
  EmrTimeGridResolution,
  EmrTimeGridTrack,
} from '@drguptavivek/emr-controller';
import {
  COMMAND_PALETTE_CATEGORIES,
  SPLIT_WORKSPACE_PRESET_OPTIONS,
  TIME_GRID_RESOLUTION_OPTIONS,
  canExecuteCommandItem,
  canMutateMasterDetail,
  canMutateSplitWorkspace,
  canStepTimeGridScroll,
  clampSparklineNorm,
  clampTimeGridScrollOffset,
  filterCommandPaletteItems,
  filterMasterDetailItems,
  groupCommandPaletteItems,
  normalizeTone,
  resolveCommandPaletteHeadingId,
  resolveCommandPaletteId,
  resolveCommandPaletteLabels,
  resolveCommandPaletteListboxId,
  resolveCommandPaletteOptionId,
  resolveCommandPalettePresentation,
  resolveMasterDetailHeadingId,
  resolveMasterDetailId,
  resolveMasterDetailLabels,
  resolveSplitWorkspaceDividerBounds,
  resolveSplitWorkspaceHeadingId,
  resolveSplitWorkspaceId,
  resolveSplitWorkspaceLabels,
  resolveSplitWorkspacePresetSizes,
  resolveSynchronizedTimeGridHeadingId,
  resolveSynchronizedTimeGridId,
  resolveSynchronizedTimeGridLabels,
  resolveTimeGridVisibleColumns,
  stepCommandPaletteIndex,
  stepSplitWorkspacePaneSizes,
  toggleMasterDetailCheckedId,
  visibleSplitWorkspacePanes,
} from './emr-workstation-containers.logic';

const TIME_GRID_DEFAULT_RESOLUTIONS: readonly EmrTimeGridResolution[] =
  TIME_GRID_RESOLUTION_OPTIONS.map((r) => r.id);

// ===========================================================================
// 1. EmrSplitWorkspaceComponent (`emr-split-workspace`)
// ===========================================================================

@Component({
  selector: 'emr-split-workspace',
  standalone: true,
  imports: [NgIcon],
  providers: [
    ...provideIcons({
      heroChevronLeft,
      heroChevronRight,
      heroEllipsisVertical,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(focusin)': 'onHostFocusIn()',
    '(focusout)': 'onHostFocusOut($event)',
  },
  template: `
    @let m = model();
    @let l = resolvedLabels();
    @let panes = visiblePanes();
    <section
      class="emr-split-ws"
      [id]="resolvedId()"
      [attr.aria-labelledby]="resolvedHeadingId()"
      [attr.data-preset]="m.preset"
    >
      <header class="emr-split-ws__toolbar">
        <div class="emr-split-ws__title-group">
          <span class="emr-split-ws__tag">{{ l.tag }}</span>
          <h3 class="emr-split-ws__title" [id]="resolvedHeadingId()">
            {{ m.title ?? l.defaultTitle }}
          </h3>
        </div>

        <div class="emr-split-ws__presets" role="group" [attr.aria-label]="l.presetsLabel" data-emr-print="hide">
          @for (preset of presets; track preset.id) {
            <button
              type="button"
              class="emr-split-ws__chip"
              [attr.aria-pressed]="m.preset === preset.id"
              [attr.aria-disabled]="m.readOnly ? 'true' : null"
              (click)="selectPreset(preset.id)"
            >{{ preset.label }}</button>
          }
        </div>

        <div class="emr-split-ws__mobile-tabs" role="tablist" [attr.aria-label]="l.mobileTabsLabel" data-emr-print="hide">
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
        @for (pane of panes; track pane.id; let idx = $index) {
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
                  data-emr-print="hide"
                  [attr.aria-expanded]="!pane.collapsed"
                  [attr.aria-label]="(pane.collapsed ? l.expand : l.collapse) + ' ' + pane.title"
                  (click)="togglePaneCollapse(pane)"
                >{{ pane.collapsed ? l.expand : l.collapse }}</button>
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

          @if (idx < panes.length - 1 && !m.readOnly) {
            @let bounds = dividerBounds(idx);
            <div class="emr-split-ws__divider" data-emr-print="hide">
              <button
                type="button"
                class="emr-split-ws__step-btn"
                [attr.aria-label]="l.shrinkPaneLabel + ' ' + pane.title + ' by 5%'"
                (click)="resizeDivider(idx, -5)"
              >
                <ng-icon name="heroChevronLeft" size="16" aria-hidden="true" />
              </button>
              <div
                class="emr-split-ws__grip"
                role="separator"
                tabindex="0"
                aria-orientation="vertical"
                [attr.aria-label]="l.resizeDividerLabel + ' ' + (idx + 1)"
                [attr.aria-valuemin]="bounds.min"
                [attr.aria-valuemax]="bounds.max"
                [attr.aria-valuenow]="bounds.now"
                (keydown)="onDividerKeydown(idx, $event)"
              >
                <ng-icon name="heroEllipsisVertical" size="16" aria-hidden="true" />
              </div>
              <button
                type="button"
                class="emr-split-ws__step-btn"
                [attr.aria-label]="l.growPaneLabel + ' ' + pane.title + ' by 5%'"
                (click)="resizeDivider(idx, 5)"
              >
                <ng-icon name="heroChevronRight" size="16" aria-hidden="true" />
              </button>
            </div>
          }
        }
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; min-width: 0; max-width: 100%; color: var(--emr-text); font-family: var(--emr-font-family); container-type: inline-size; }
    .emr-split-ws { border: 1px solid var(--emr-border); border-radius: 12px; background: var(--emr-surface); overflow: hidden; min-width: 0; max-width: 100%; }
    .emr-split-ws__toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--emr-border); background: var(--emr-surface-soft); min-width: 0; }
    .emr-split-ws__title-group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 0; }
    .emr-split-ws__tag { padding: 3px 8px; border-radius: 6px; background: var(--emr-primary); color: var(--emr-surface); font-family: var(--emr-font-mono); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); }
    .emr-split-ws__title { margin: 0; font-size: var(--emr-text-md); font-weight: var(--emr-weight-bold); }
    .emr-split-ws__presets { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; min-width: 0; }
    .emr-split-ws__mobile-tabs { display: none; flex-wrap: wrap; gap: 6px; align-items: center; min-width: 0; }
    .emr-split-ws__chip, .emr-split-ws__tab, .emr-split-ws__collapse-btn, .emr-split-ws__step-btn { min-height: 44px; min-width: 44px; padding: 6px 12px; border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); font: inherit; font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 4px; }
    .emr-split-ws__chip[aria-pressed="true"], .emr-split-ws__tab[aria-selected="true"] { border-color: var(--emr-primary); background: var(--emr-primary-soft); color: var(--emr-primary-contrast); }
    .emr-split-ws__chip[aria-disabled="true"] { opacity: 0.5; cursor: not-allowed; }
    .emr-split-ws__panes { display: flex; align-items: stretch; min-height: 280px; min-width: 0; }
    .emr-split-ws__pane { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; background: var(--emr-surface); }
    .emr-split-ws__pane--collapsed { flex: 0 0 64px !important; }
    .emr-split-ws__pane-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--emr-border); background: var(--emr-surface-raised); flex-wrap: wrap; min-width: 0; }
    .emr-split-ws__pane-titles { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 0; }
    .emr-split-ws__pane-title { margin: 0; font-size: var(--emr-text-sm); font-weight: var(--emr-weight-bold); }
    .emr-split-ws__pane-sub { color: var(--emr-text-muted); font-size: var(--emr-text-xs); }
    .emr-split-ws__badge { padding: 2px 8px; border-radius: 999px; background: var(--emr-info-soft); color: var(--emr-info); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); }
    .emr-split-ws__badge[data-tone="warning"] { background: var(--emr-warning-soft); color: var(--emr-warning); }
    .emr-split-ws__badge[data-tone="danger"] { background: var(--emr-danger-soft); color: var(--emr-danger); }
    .emr-split-ws__badge[data-tone="success"] { background: var(--emr-success-soft); color: var(--emr-success); }
    .emr-split-ws__badge[data-tone="neutral"] { background: var(--emr-neutral-soft); color: var(--emr-text); }
    .emr-split-ws__pane-body { padding: 12px; flex: 1; overflow: auto; min-width: 0; }
    .emr-split-ws__pane-body[data-collapsed="true"] { display: none; }
    .emr-split-ws__summary { margin: 0; padding-inline-start: 18px; display: grid; gap: 4px; font-size: var(--emr-text-sm); }
    .emr-split-ws__divider { flex: 0 0 48px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 4px 2px; background: var(--emr-surface-soft); border-inline: 1px solid var(--emr-border); }
    .emr-split-ws__grip:focus-visible, .emr-split-ws__chip:focus-visible, .emr-split-ws__tab:focus-visible, .emr-split-ws__collapse-btn:focus-visible, .emr-split-ws__step-btn:focus-visible { outline: 3px solid var(--emr-focus); outline-offset: 2px; }
    .emr-split-ws__step-btn { padding: 4px; }
    .emr-split-ws__grip { color: var(--emr-text-muted); display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; border-radius: 6px; cursor: col-resize; }
    @container (max-width: 720px) {
      .emr-split-ws__mobile-tabs { display: flex; width: 100%; }
      .emr-split-ws__panes { flex-direction: column; min-height: 0; }
      .emr-split-ws__divider { display: none; }
      .emr-split-ws__pane:not(.emr-split-ws__pane--mobile-active) { display: none; }
      .emr-split-ws__pane--mobile-active { flex: 1 1 auto !important; flex-basis: auto !important; width: 100%; }
    }
    @media (max-width: 720px) {
      .emr-split-ws__mobile-tabs { display: flex; width: 100%; }
      .emr-split-ws__panes { flex-direction: column; min-height: 0; }
      .emr-split-ws__divider { display: none; }
      .emr-split-ws__pane:not(.emr-split-ws__pane--mobile-active) { display: none; }
      .emr-split-ws__pane--mobile-active { flex: 1 1 auto !important; flex-basis: auto !important; width: 100%; }
    }
    @media print {
      .emr-split-ws__presets, .emr-split-ws__mobile-tabs, .emr-split-ws__divider, .emr-split-ws__collapse-btn { display: none !important; }
      .emr-split-ws__panes { display: block; }
      .emr-split-ws__pane, .emr-split-ws__pane--collapsed { display: block !important; width: 100% !important; flex-basis: auto !important; break-inside: avoid; margin-bottom: 12px; }
      .emr-split-ws__pane-body, .emr-split-ws__pane-body[data-collapsed="true"] { display: block !important; overflow: visible !important; }
    }
    :host-context(.emr-print) .emr-split-ws__presets,
    :host-context(.emr-print) .emr-split-ws__mobile-tabs,
    :host-context(.emr-print) .emr-split-ws__divider,
    :host-context(.emr-print) .emr-split-ws__collapse-btn { display: none !important; }
    :host-context(.emr-print) .emr-split-ws__panes { display: block; }
    :host-context(.emr-print) .emr-split-ws__pane,
    :host-context(.emr-print) .emr-split-ws__pane--collapsed { display: block !important; width: 100% !important; flex-basis: auto !important; break-inside: avoid; margin-bottom: 12px; }
    :host-context(.emr-print) .emr-split-ws__pane-body,
    :host-context(.emr-print) .emr-split-ws__pane-body[data-collapsed="true"] { display: block !important; overflow: visible !important; }
  `],
})
export class EmrSplitWorkspaceComponent {
  readonly model = input.required<EmrSplitWorkspaceViewModel>();
  readonly headingId = input<string>();
  readonly idPrefix = input<string>('');
  readonly labels = input<Partial<EmrSplitWorkspaceLabels>>({});
  readonly intent = output<EmrSplitWorkspaceIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  protected readonly presets = SPLIT_WORKSPACE_PRESET_OPTIONS;
  protected readonly resolvedLabels = computed(() => resolveSplitWorkspaceLabels(this.labels()));
  protected readonly resolvedId = computed(() =>
    resolveSplitWorkspaceId(this.model().id, this.idPrefix()),
  );
  protected readonly resolvedHeadingId = computed(() =>
    resolveSplitWorkspaceHeadingId(this.model().id, this.idPrefix(), this.headingId()),
  );

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private isFocusWithin = false;

  visiblePanes(): readonly EmrSplitWorkspacePane[] {
    const m = this.model();
    return visibleSplitWorkspacePanes(m.panes, m.preset);
  }

  activeMobilePaneId(): string {
    const m = this.model();
    const panes = this.visiblePanes();
    if (m.mobileActivePaneId && panes.some((p) => p.id === m.mobileActivePaneId)) {
      return m.mobileActivePaneId;
    }
    return panes[0]?.id ?? m.panes[0]?.id ?? '';
  }

  paneWidthPct(index: number, pane: EmrSplitWorkspacePane): number {
    if (pane.collapsed) return 6;
    const sizes = this.model().paneSizes;
    return sizes[index] ?? Math.round(100 / Math.max(1, this.visiblePanes().length));
  }

  dividerBounds(dividerIndex: number) {
    return resolveSplitWorkspaceDividerBounds(
      this.model().paneSizes,
      dividerIndex,
      this.visiblePanes(),
    );
  }

  selectPreset(preset: EmrSplitWorkspacePreset): void {
    const m = this.model();
    if (!canMutateSplitWorkspace(m)) return;
    const targetCount = preset === '3-pane' ? Math.min(3, m.panes.length) : Math.min(2, m.panes.length);
    const paneSizes = resolveSplitWorkspacePresetSizes(preset, targetCount);
    this.intent.emit({ type: 'presetChanged', preset, paneSizes });
  }

  resizeDivider(dividerIndex: number, deltaPct: number): void {
    const m = this.model();
    if (!canMutateSplitWorkspace(m)) return;
    const paneSizes = stepSplitWorkspacePaneSizes(
      m.paneSizes,
      dividerIndex,
      deltaPct,
      this.visiblePanes(),
    );
    this.intent.emit({ type: 'paneResized', dividerIndex, deltaPct, paneSizes });
  }

  onDividerKeydown(dividerIndex: number, event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.resizeDivider(dividerIndex, -5);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.resizeDivider(dividerIndex, 5);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.resizeDivider(dividerIndex, -100);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.resizeDivider(dividerIndex, 100);
    }
  }

  togglePaneCollapse(pane: EmrSplitWorkspacePane): void {
    if (!canMutateSplitWorkspace(this.model())) return;
    this.intent.emit({
      type: 'paneCollapsedToggled',
      paneId: pane.id,
      collapsed: !pane.collapsed,
    });
  }

  selectMobilePane(paneId: string): void {
    this.intent.emit({ type: 'mobilePaneSelected', paneId });
  }

  protected onHostFocusIn(): void {
    if (!this.isFocusWithin) {
      this.isFocusWithin = true;
      this.focused.emit();
    }
  }

  protected onHostFocusOut(e: FocusEvent): void {
    const next = e.relatedTarget as Node | null;
    if (next && this.host.nativeElement.contains(next)) return;
    if (this.isFocusWithin) {
      this.isFocusWithin = false;
      this.blurred.emit();
    }
  }
}

// ===========================================================================
// 2. EmrCommandPaletteComponent (`emr-command-palette`)
// ===========================================================================

@Component({
  selector: 'emr-command-palette',
  standalone: true,
  imports: [NgIcon],
  providers: [
    ...provideIcons({
      heroXMark,
      heroStarSolid,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(focusin)': 'onHostFocusIn()',
    '(focusout)': 'onHostFocusOut($event)',
  },
  template: `
    @let m = model();
    @let l = resolvedLabels();
    @let mode = presentation();
    @if (m.open) {
      <div
        class="emr-cmd-backdrop"
        [class.emr-cmd-backdrop--modal]="mode === 'modal'"
        [class.emr-cmd-backdrop--inline]="mode === 'inline'"
        (click)="mode === 'modal' ? dismiss() : null"
      >
        <section
          class="emr-cmd"
          [class.emr-cmd--inline]="mode === 'inline'"
          [id]="resolvedId()"
          [attr.role]="mode === 'modal' ? 'dialog' : 'region'"
          [attr.aria-modal]="mode === 'modal' ? 'true' : null"
          [attr.aria-labelledby]="resolvedHeadingId()"
          (click)="$event.stopPropagation()"
          (keydown)="onKeydown($event)"
        >
          <header class="emr-cmd__head">
            <div class="emr-cmd__title-row">
              <span class="emr-cmd__kbd" data-emr-print="hide">⌘K</span>
              <h3 class="emr-cmd__title" [id]="resolvedHeadingId()">
                {{ m.title ?? l.defaultTitle }}
              </h3>
              <button
                type="button"
                class="emr-cmd__close"
                data-emr-print="hide"
                [attr.aria-label]="l.closeLabel"
                (click)="dismiss()"
              >
                <span>Esc</span>
                <ng-icon name="heroXMark" size="16" aria-hidden="true" />
              </button>
            </div>

            <input
              type="search"
              class="emr-cmd__input"
              role="combobox"
              aria-autocomplete="list"
              data-emr-print="hide"
              [attr.aria-expanded]="m.open ? 'true' : 'false'"
              [attr.aria-controls]="listboxId()"
              [attr.aria-activedescendant]="activeOptionId()"
              [value]="m.query"
              [placeholder]="m.placeholder ?? l.defaultPlaceholder"
              [attr.aria-label]="l.searchLabel"
              (input)="onQueryInput($event)"
            />

            <div class="emr-cmd__categories" role="tablist" [attr.aria-label]="l.categoriesLabel" data-emr-print="hide">
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

          <div
            class="emr-cmd__body"
            role="listbox"
            [id]="listboxId()"
            [attr.aria-label]="l.resultsLabel"
          >
            @if (!filteredItems().length) {
              <p class="emr-cmd__empty" role="status">
                {{ m.emptyMessage ?? l.emptyMessage }}
              </p>
            } @else {
              @for (group of groupedItems(); track group.label) {
                <div class="emr-cmd__group">
                  <div class="emr-cmd__group-label">{{ group.label }}</div>
                  @for (entry of group.items; track entry.item.id) {
                    @let itemInert = !!entry.item.disabled || !!m.readOnly;
                    <button
                      type="button"
                      role="option"
                      class="emr-cmd__item"
                      [id]="optionId(entry.item.id)"
                      [class.emr-cmd__item--active]="entry.flatIndex === m.activeIndex"
                      [attr.aria-selected]="entry.flatIndex === m.activeIndex"
                      [attr.aria-disabled]="itemInert ? 'true' : null"
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
                          <span class="emr-cmd__pin">
                            <ng-icon name="heroStarSolid" size="12" aria-hidden="true" />
                            <span>{{ l.pinnedLabel }}</span>
                          </span>
                        } @else if (entry.item.recent) {
                          <span class="emr-cmd__recent">{{ l.recentLabel }}</span>
                        }
                        @if (entry.item.badge) {
                          <span class="emr-cmd__badge" [attr.data-tone]="entry.item.badge.tone">{{ entry.item.badge.label }}</span>
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
    :host { display: block; min-width: 0; max-width: 100%; color: var(--emr-text); font-family: var(--emr-font-family); container-type: inline-size; }
    .emr-cmd-backdrop--modal { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: flex-start; justify-content: center; padding: 48px 16px 16px; background: color-mix(in srgb, var(--emr-background) 78%, transparent); backdrop-filter: blur(4px); overflow-y: auto; }
    .emr-cmd-backdrop--inline { padding: 0; min-width: 0; max-width: 100%; }
    .emr-cmd { width: 100%; max-width: 680px; margin: 0 auto; border: 1px solid var(--emr-border); border-radius: 12px; background: var(--emr-surface); box-shadow: var(--emr-shadow); overflow: hidden; min-width: 0; }
    .emr-cmd--inline { max-width: 100%; box-shadow: none; }
    .emr-cmd__head { padding: 12px 14px; border-bottom: 1px solid var(--emr-border); background: var(--emr-surface-soft); display: grid; gap: 10px; min-width: 0; }
    .emr-cmd__title-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; min-width: 0; }
    .emr-cmd__kbd, .emr-cmd__shortcut { padding: 2px 7px; border: 1px solid var(--emr-border); border-radius: 5px; background: var(--emr-surface-raised); color: var(--emr-text); font-family: var(--emr-font-mono); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); }
    .emr-cmd__title { margin: 0; flex: 1; min-width: 0; font-size: var(--emr-text-md); font-weight: var(--emr-weight-bold); }
    .emr-cmd__close { min-height: 44px; min-width: 44px; padding: 6px 12px; border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text-muted); font: inherit; font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 4px; }
    .emr-cmd__input { width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--emr-border); border-radius: 8px; background: var(--emr-surface); color: var(--emr-text); font: inherit; font-size: var(--emr-text-md); }
    .emr-cmd__input:focus-visible, .emr-cmd__close:focus-visible, .emr-cmd__cat-pill:focus-visible, .emr-cmd__item:focus-visible { outline: 3px solid var(--emr-focus); outline-offset: 2px; }
    .emr-cmd__categories { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; }
    .emr-cmd__cat-pill { min-height: 44px; min-width: 44px; padding: 6px 12px; border: 1px solid var(--emr-border); border-radius: 999px; background: var(--emr-surface); color: var(--emr-text); font: inherit; font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
    .emr-cmd__cat-pill[aria-selected="true"] { border-color: var(--emr-primary); background: var(--emr-primary-soft); color: var(--emr-primary-contrast); }
    .emr-cmd__body { max-height: 360px; overflow-y: auto; padding: 8px; display: grid; gap: 10px; min-width: 0; }
    .emr-cmd__empty { margin: 16px; text-align: center; color: var(--emr-text-muted); font-size: var(--emr-text-sm); }
    .emr-cmd__group { display: grid; gap: 4px; min-width: 0; }
    .emr-cmd__group-label { padding: 2px 8px; color: var(--emr-text-muted); font-family: var(--emr-font-mono); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); text-transform: uppercase; }
    .emr-cmd__item { width: 100%; min-height: 44px; padding: 8px 10px; border: 1px solid transparent; border-radius: 8px; background: transparent; color: var(--emr-text); display: flex; align-items: center; justify-content: space-between; gap: 12px; text-align: start; font: inherit; cursor: pointer; flex-wrap: wrap; }
    .emr-cmd__item--active, .emr-cmd__item:hover:not([aria-disabled="true"]) { border-color: var(--emr-primary-border); background: var(--emr-primary-soft); }
    .emr-cmd__item[aria-disabled="true"] { opacity: 0.5; cursor: not-allowed; }
    .emr-cmd__item-main { display: grid; gap: 2px; min-width: 0; flex: 1 1 180px; }
    .emr-cmd__item-label { font-size: var(--emr-text-sm); font-weight: var(--emr-weight-bold); overflow-wrap: anywhere; }
    .emr-cmd__item-sub { color: var(--emr-text-muted); font-size: var(--emr-text-xs); overflow-wrap: anywhere; }
    .emr-cmd__item-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; flex-shrink: 0; }
    .emr-cmd__pin { display: inline-flex; align-items: center; gap: 4px; color: var(--emr-warning); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); }
    .emr-cmd__recent { color: var(--emr-info); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); }
    .emr-cmd__badge { padding: 2px 7px; border-radius: 999px; background: var(--emr-info-soft); color: var(--emr-info); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); }
    .emr-cmd__badge[data-tone="success"] { background: var(--emr-success-soft); color: var(--emr-success); }
    .emr-cmd__badge[data-tone="warning"] { background: var(--emr-warning-soft); color: var(--emr-warning); }
    .emr-cmd__badge[data-tone="danger"] { background: var(--emr-danger-soft); color: var(--emr-danger); }
    @media print {
      .emr-cmd-backdrop--modal { position: static !important; padding: 0 !important; background: transparent !important; }
      [data-emr-print="hide"] { display: none !important; }
      .emr-cmd { box-shadow: none !important; max-width: none !important; }
      .emr-cmd__body { max-height: none !important; overflow: visible !important; }
    }
    :host-context(.emr-print) .emr-cmd-backdrop--modal { position: static !important; padding: 0 !important; background: transparent !important; }
    :host-context(.emr-print) [data-emr-print="hide"] { display: none !important; }
    :host-context(.emr-print) .emr-cmd { box-shadow: none !important; max-width: none !important; }
    :host-context(.emr-print) .emr-cmd__body { max-height: none !important; overflow: visible !important; }
  `],
})
export class EmrCommandPaletteComponent {
  readonly model = input.required<EmrCommandPaletteViewModel>();
  readonly headingId = input<string>();
  readonly idPrefix = input<string>('');
  readonly labels = input<Partial<EmrCommandPaletteLabels>>({});
  readonly intent = output<EmrCommandPaletteIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  protected readonly categories = COMMAND_PALETTE_CATEGORIES;
  protected readonly resolvedLabels = computed(() => resolveCommandPaletteLabels(this.labels()));
  protected readonly resolvedId = computed(() =>
    resolveCommandPaletteId(this.model().id, this.idPrefix()),
  );
  protected readonly resolvedHeadingId = computed(() =>
    resolveCommandPaletteHeadingId(this.model().id, this.idPrefix(), this.headingId()),
  );
  protected readonly listboxId = computed(() =>
    resolveCommandPaletteListboxId(this.model().id, this.idPrefix()),
  );
  protected readonly presentation = computed(() => resolveCommandPalettePresentation(this.model()));

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private isFocusWithin = false;

  optionId(itemId: string): string {
    return resolveCommandPaletteOptionId(this.model().id, itemId, this.idPrefix());
  }

  activeOptionId(): string | null {
    const items = this.filteredItems();
    const active = items[this.model().activeIndex];
    return active ? this.optionId(active.id) : null;
  }

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
    if (!canExecuteCommandItem(this.model(), item)) return;
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
      if (canExecuteCommandItem(m, current)) {
        event.preventDefault();
        this.executeItem(current!);
      }
    }
  }

  protected onHostFocusIn(): void {
    if (!this.isFocusWithin) {
      this.isFocusWithin = true;
      this.focused.emit();
    }
  }

  protected onHostFocusOut(e: FocusEvent): void {
    const next = e.relatedTarget as Node | null;
    if (next && this.host.nativeElement.contains(next)) return;
    if (this.isFocusWithin) {
      this.isFocusWithin = false;
      this.blurred.emit();
    }
  }
}

// ===========================================================================
// 3. EmrMasterDetailComponent (`emr-master-detail`)
// ===========================================================================

@Component({
  selector: 'emr-master-detail',
  standalone: true,
  imports: [NgIcon],
  providers: [
    ...provideIcons({
      heroArrowLeft,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(focusin)': 'onHostFocusIn()',
    '(focusout)': 'onHostFocusOut($event)',
  },
  template: `
    @let m = model();
    @let l = resolvedLabels();
    <section
      class="emr-md"
      [id]="resolvedId()"
      [attr.aria-labelledby]="resolvedHeadingId()"
      [attr.data-mobile-detail]="m.mobileDetailOpen ? 'open' : 'closed'"
    >
      <div class="emr-md__master">
        <header class="emr-md__master-head">
          <div class="emr-md__title-row">
            <div class="emr-md__title-wrap">
              <h3 class="emr-md__title" [id]="resolvedHeadingId()">{{ m.title }}</h3>
              @if (m.subtitle) {
                <p class="emr-md__subtitle">{{ m.subtitle }}</p>
              }
            </div>
            @if (m.batchActions?.length && (m.checkedIds?.length ?? 0) > 0 && !m.readOnly) {
              <div class="emr-md__batch-bar" data-emr-print="hide">
                @for (act of m.batchActions!; track act.id) {
                  <button
                    type="button"
                    class="emr-md__btn"
                    [class.emr-md__btn--primary]="act.primary"
                    (click)="triggerAction(act.id, m.checkedIds!)"
                  >{{ act.label }} ({{ m.checkedIds!.length }})</button>
                }
              </div>
            }
          </div>

          <input
            type="search"
            class="emr-md__search"
            data-emr-print="hide"
            [value]="m.searchQuery"
            [placeholder]="m.searchPlaceholder ?? l.searchPlaceholder"
            [attr.aria-label]="l.searchLabel"
            (input)="onSearchInput($event)"
          />

          @if (m.filters.length) {
            <div class="emr-md__filters" role="tablist" [attr.aria-label]="l.filtersLabel" data-emr-print="hide">
              @for (f of m.filters; track f.id) {
                <button
                  type="button"
                  role="tab"
                  class="emr-md__filter-pill"
                  [attr.aria-selected]="m.activeFilterId === f.id"
                  (click)="selectFilter(f.id)"
                >
                  <span>{{ f.label }}</span>
                  @if (f.count !== undefined) {
                    <span class="emr-md__filter-count">{{ f.count }}</span>
                  }
                </button>
              }
            </div>
          }
        </header>

        <ng-content select="[slot=master]" />

        @if (!filteredItems().length) {
          <p class="emr-md__empty" role="status">
            {{ m.emptyListMessage ?? l.emptyListMessage }}
          </p>
        } @else {
          <ul class="emr-md__list" [attr.aria-label]="m.title + l.listLabelSuffix">
            @for (item of filteredItems(); track item.id) {
              <li
                class="emr-md__row"
                [class.emr-md__row--selected]="item.id === m.selectedId"
                [class.emr-md__row--unread]="item.unread"
              >
                @if (!m.readOnly) {
                  <label class="emr-md__check-hit" data-emr-print="hide">
                    <input
                      type="checkbox"
                      class="emr-md__checkbox"
                      [checked]="isChecked(item.id)"
                      [attr.aria-label]="'Select ' + item.title"
                      (change)="toggleBatchItem(item.id)"
                    />
                  </label>
                }
                <button
                  type="button"
                  class="emr-md__row-btn"
                  [attr.aria-current]="item.id === m.selectedId ? 'true' : null"
                  (click)="selectItem(item.id)"
                >
                  <div class="emr-md__row-top">
                    <span class="emr-md__row-title">
                      @if (item.unread) {
                        <span class="emr-md__unread-dot" aria-hidden="true">
                          <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true" focusable="false">
                            <circle cx="4" cy="4" r="4" fill="currentColor" />
                          </svg>
                        </span>
                        <span class="emr-sr-only">{{ l.unreadLabel }}: </span>
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
              </li>
            }
          </ul>
        }
      </div>

      <aside class="emr-md__detail" [attr.aria-label]="l.detailLabel">
        <div class="emr-md__mobile-bar" data-emr-print="hide">
          <button
            type="button"
            class="emr-md__btn"
            [attr.aria-label]="l.backToList"
            (click)="closeDetail()"
          >
            <ng-icon name="heroArrowLeft" size="16" aria-hidden="true" />
            <span>{{ l.backToList }}</span>
          </button>
        </div>

        <ng-content select="[slot=detail]" />

        @if (selectedItem(); as sel) {
          <article class="emr-md__inspector">
            <header class="emr-md__inspector-head">
              <div class="emr-md__title-wrap">
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
              <footer class="emr-md__actions" data-emr-print="hide">
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
            {{ m.emptyDetailMessage ?? l.emptyDetailMessage }}
          </p>
        }
      </aside>
    </section>
  `,
  styles: [`
    :host { display: block; min-width: 0; max-width: 100%; color: var(--emr-text); font-family: var(--emr-font-family); container-type: inline-size; }
    .emr-sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
    .emr-md { display: grid; grid-template-columns: minmax(260px, 1fr) minmax(0, 1.6fr); border: 1px solid var(--emr-border); border-radius: 12px; background: var(--emr-surface); overflow: hidden; min-height: 340px; min-width: 0; max-width: 100%; }
    .emr-md__master { border-inline-end: 1px solid var(--emr-border); display: flex; flex-direction: column; min-width: 0; }
    .emr-md__master-head { padding: 12px; border-bottom: 1px solid var(--emr-border); background: var(--emr-surface-soft); display: grid; gap: 8px; min-width: 0; }
    .emr-md__title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; flex-wrap: wrap; min-width: 0; }
    .emr-md__title-wrap { min-width: 0; flex: 1 1 180px; }
    .emr-md__title { margin: 0; font-size: var(--emr-text-md); font-weight: var(--emr-weight-bold); }
    .emr-md__subtitle { margin: 2px 0 0; color: var(--emr-text-muted); font-size: var(--emr-text-xs); }
    .emr-md__search { width: 100%; min-height: 44px; padding: 8px 12px; border: 1px solid var(--emr-border); border-radius: 8px; background: var(--emr-surface); color: var(--emr-text); font: inherit; font-size: var(--emr-text-sm); }
    .emr-md__filters, .emr-md__batch-bar, .emr-md__badges, .emr-md__actions { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; min-width: 0; }
    .emr-md__filter-pill, .emr-md__btn { min-height: 44px; min-width: 44px; padding: 6px 12px; border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); font: inherit; font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
    .emr-md__filter-pill[aria-selected="true"], .emr-md__btn--primary { border-color: var(--emr-primary); background: var(--emr-primary-soft); color: var(--emr-primary-contrast); }
    .emr-md__filter-count { padding: 1px 6px; border-radius: 999px; background: var(--emr-surface-raised); font-size: var(--emr-text-2xs); }
    .emr-md__list { flex: 1; overflow-y: auto; margin: 0; padding: 0; list-style: none; min-width: 0; }
    .emr-md__row { display: flex; align-items: flex-start; gap: 6px; padding: 6px 10px; border-bottom: 1px solid var(--emr-border); min-width: 0; }
    .emr-md__row--selected { background: var(--emr-primary-soft); }
    .emr-md__check-hit { min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; cursor: pointer; border-radius: 6px; }
    .emr-md__checkbox { width: 18px; height: 18px; margin: 0; accent-color: var(--emr-primary); cursor: pointer; }
    .emr-md__row-btn { flex: 1; min-height: 44px; border: 0; padding: 4px 6px; border-radius: 6px; background: transparent; color: var(--emr-text); text-align: start; font: inherit; cursor: pointer; display: grid; gap: 4px; min-width: 0; }
    .emr-md__row-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; flex-wrap: wrap; min-width: 0; }
    .emr-md__row-title { font-size: var(--emr-text-sm); font-weight: var(--emr-weight-bold); display: inline-flex; align-items: center; gap: 6px; min-width: 0; overflow-wrap: anywhere; }
    .emr-md__unread-dot { color: var(--emr-primary); display: inline-flex; align-items: center; flex-shrink: 0; }
    .emr-md__time, .emr-md__row-sub { color: var(--emr-text-muted); font-size: var(--emr-text-xs); overflow-wrap: anywhere; }
    .emr-md__badge { padding: 2px 8px; border-radius: 999px; background: var(--emr-info-soft); color: var(--emr-info); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); }
    .emr-md__badge[data-tone="danger"] { background: var(--emr-danger-soft); color: var(--emr-danger); }
    .emr-md__badge[data-tone="warning"] { background: var(--emr-warning-soft); color: var(--emr-warning); }
    .emr-md__badge[data-tone="success"] { background: var(--emr-success-soft); color: var(--emr-success); }
    .emr-md__badge[data-tone="neutral"] { background: var(--emr-neutral-soft); color: var(--emr-text); }
    .emr-md__detail { padding: 16px; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
    .emr-md__mobile-bar { display: none; }
    .emr-md__inspector { display: grid; gap: 14px; min-width: 0; }
    .emr-md__inspector-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--emr-border); flex-wrap: wrap; min-width: 0; }
    .emr-md__inspector-title { margin: 0; font-size: var(--emr-text-lg); overflow-wrap: anywhere; }
    .emr-md__fields { margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; padding: 10px; border-radius: 8px; background: var(--emr-surface-soft); }
    .emr-md__field dt { color: var(--emr-text-muted); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); text-transform: uppercase; }
    .emr-md__field dd { margin: 2px 0 0; font-size: var(--emr-text-sm); font-weight: var(--emr-weight-bold); }
    .emr-md__body { margin: 0; font-size: var(--emr-text-sm); line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; }
    .emr-md__empty { margin: 16px; color: var(--emr-text-muted); font-size: var(--emr-text-sm); text-align: center; }
    .emr-md__search:focus-visible, .emr-md__filter-pill:focus-visible, .emr-md__btn:focus-visible, .emr-md__row-btn:focus-visible, .emr-md__checkbox:focus-visible { outline: 3px solid var(--emr-focus); outline-offset: 2px; }
    @container (max-width: 720px) {
      .emr-md { grid-template-columns: minmax(0, 1fr); }
      .emr-md__master { border-inline-end: 0; }
      .emr-md__mobile-bar { display: flex; }
      .emr-md[data-mobile-detail="open"] .emr-md__master { display: none; }
      .emr-md[data-mobile-detail="closed"] .emr-md__detail { display: none; }
    }
    @media (max-width: 720px) {
      .emr-md { grid-template-columns: minmax(0, 1fr); }
      .emr-md__master { border-inline-end: 0; }
      .emr-md__mobile-bar { display: flex; }
      .emr-md[data-mobile-detail="open"] .emr-md__master { display: none; }
      .emr-md[data-mobile-detail="closed"] .emr-md__detail { display: none; }
    }
    @media print {
      [data-emr-print="hide"] { display: none !important; }
      .emr-md { display: block; overflow: visible !important; }
      .emr-md__master { border-inline-end: 0; border-bottom: 1px solid var(--emr-border); display: block !important; }
      .emr-md__detail { display: block !important; }
      .emr-md__list { overflow: visible !important; }
    }
    :host-context(.emr-print) [data-emr-print="hide"] { display: none !important; }
    :host-context(.emr-print) .emr-md { display: block; overflow: visible !important; }
    :host-context(.emr-print) .emr-md__master { border-inline-end: 0; border-bottom: 1px solid var(--emr-border); display: block !important; }
    :host-context(.emr-print) .emr-md__detail { display: block !important; }
    :host-context(.emr-print) .emr-md__list { overflow: visible !important; }
  `],
})
export class EmrMasterDetailComponent {
  readonly model = input.required<EmrMasterDetailViewModel>();
  readonly headingId = input<string>();
  readonly idPrefix = input<string>('');
  readonly labels = input<Partial<EmrMasterDetailLabels>>({});
  readonly intent = output<EmrMasterDetailIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  protected readonly resolvedLabels = computed(() => resolveMasterDetailLabels(this.labels()));
  protected readonly resolvedId = computed(() =>
    resolveMasterDetailId(this.model().id, this.idPrefix()),
  );
  protected readonly resolvedHeadingId = computed(() =>
    resolveMasterDetailHeadingId(this.model().id, this.idPrefix(), this.headingId()),
  );

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private isFocusWithin = false;

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
    setTimeout(() => {
      const root = this.host?.nativeElement;
      if (typeof root?.querySelector !== 'function') return;
      const target =
        root.querySelector<HTMLElement>('.emr-md__row-btn[aria-current="true"]') ??
        root.querySelector<HTMLElement>('.emr-md__row-btn');
      target?.focus();
    }, 0);
  }

  toggleBatchItem(itemId: string): void {
    if (!canMutateMasterDetail(this.model())) return;
    const checkedIds = toggleMasterDetailCheckedId(this.model().checkedIds ?? [], itemId);
    this.intent.emit({ type: 'batchSelectionToggled', itemId, checkedIds });
  }

  triggerAction(actionId: string, itemIds: readonly string[]): void {
    if (!canMutateMasterDetail(this.model())) return;
    this.intent.emit({ type: 'actionTriggered', actionId, itemIds });
  }

  protected onHostFocusIn(): void {
    if (!this.isFocusWithin) {
      this.isFocusWithin = true;
      this.focused.emit();
    }
  }

  protected onHostFocusOut(e: FocusEvent): void {
    const next = e.relatedTarget as Node | null;
    if (next && this.host.nativeElement.contains(next)) return;
    if (this.isFocusWithin) {
      this.isFocusWithin = false;
      this.blurred.emit();
    }
  }
}

// ===========================================================================
// 4. EmrSynchronizedTimeGridComponent (`emr-synchronized-time-grid`)
// ===========================================================================

@Component({
  selector: 'emr-synchronized-time-grid',
  standalone: true,
  imports: [NgIcon],
  providers: [
    ...provideIcons({
      heroChevronLeft,
      heroChevronRight,
      heroChevronDown,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(focusin)': 'onHostFocusIn()',
    '(focusout)': 'onHostFocusOut($event)',
  },
  template: `
    @let m = model();
    @let l = resolvedLabels();
    @let cols = visibleColumns();
    @let canEarlier = canStepEarlier();
    @let canLater = canStepLater();
    <section
      class="emr-stg"
      [id]="resolvedId()"
      [attr.aria-labelledby]="resolvedHeadingId()"
    >
      <header class="emr-stg__toolbar">
        <div class="emr-stg__title-wrap">
          <h3 class="emr-stg__title" [id]="resolvedHeadingId()">{{ m.title }}</h3>
          @if (m.subtitle) {
            <p class="emr-stg__sub">{{ m.subtitle }}</p>
          }
        </div>

        <div class="emr-stg__controls" data-emr-print="hide">
          <div class="emr-stg__resolutions" role="group" [attr.aria-label]="l.resolutionGroupLabel">
            @for (res of resolutions(); track res) {
              <button
                type="button"
                class="emr-stg__btn"
                [attr.aria-pressed]="m.resolution === res"
                [attr.aria-disabled]="m.readOnly ? 'true' : null"
                (click)="selectResolution(res)"
              >{{ res }}</button>
            }
          </div>

          <div class="emr-stg__nav" role="group" [attr.aria-label]="l.scrollGroupLabel">
            <button
              type="button"
              class="emr-stg__btn"
              [attr.aria-label]="'Scroll ' + l.earlier.toLowerCase()"
              [attr.aria-disabled]="!canEarlier ? 'true' : null"
              (click)="stepScroll(-1)"
            >
              <ng-icon name="heroChevronLeft" size="16" aria-hidden="true" />
              <span>{{ l.earlier }}</span>
            </button>
            <span class="emr-stg__offset-label">Col +{{ m.scrollOffset }}</span>
            <button
              type="button"
              class="emr-stg__btn"
              [attr.aria-label]="'Scroll ' + l.later.toLowerCase()"
              [attr.aria-disabled]="!canLater ? 'true' : null"
              (click)="stepScroll(1)"
            >
              <span>{{ l.later }}</span>
              <ng-icon name="heroChevronRight" size="16" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <div class="emr-stg__scroll-viewport" data-emr-print="expand">
        <div class="emr-stg__grid" [style.--emr-stg-cols]="cols.length">
          <div class="emr-stg__axis-row">
            <div class="emr-stg__lead-cell">{{ l.timeAxisPrefix }} ({{ m.resolution }})</div>
            @for (col of cols; track col.id) {
              <button
                type="button"
                class="emr-stg__col-head"
                [class.emr-stg__col-head--current]="col.isCurrentTime"
                [class.emr-stg__col-head--selected]="col.id === m.selectedColumnId"
                [attr.aria-pressed]="col.id === m.selectedColumnId"
                [attr.aria-disabled]="m.readOnly ? 'true' : null"
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
                  <span class="emr-stg__now">{{ l.nowBadge }}</span>
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
                  <span class="emr-stg__track-label-group">
                    <ng-icon
                      [name]="track.collapsed ? 'heroChevronRight' : 'heroChevronDown'"
                      size="16"
                      aria-hidden="true"
                    />
                    <span>{{ track.title }}</span>
                    @if (track.badge) {
                      <span class="emr-stg__badge" [attr.data-tone]="track.badge.tone">
                        {{ track.badge.label }}
                      </span>
                    }
                  </span>
                  <span class="emr-stg__track-kind">{{ track.kind.toUpperCase() }}</span>
                </button>
              </header>

              <div class="emr-stg__track-rows" [attr.data-collapsed]="track.collapsed ? 'true' : null">
                @for (row of track.rows; track row.id) {
                  <div class="emr-stg__row">
                    <div class="emr-stg__row-lead">
                      <span class="emr-stg__row-label">{{ row.label }}</span>
                      @if (row.unitLabel) {
                        <span class="emr-stg__row-unit">{{ row.unitLabel }}</span>
                      }
                      @if (row.referenceRangeLabel) {
                        <span class="emr-stg__row-ref">{{ row.referenceRangeLabel }}</span>
                      }
                    </div>

                    @for (col of cols; track col.id) {
                      @let cell = row.cells[col.id];
                      @let spark = sparkNorm(cell?.sparklineNorm);
                      <button
                        type="button"
                        class="emr-stg__cell"
                        [class.emr-stg__cell--selected]="isCellSelected(track.id, row.id, col.id)"
                        [attr.data-tone]="cell?.abnormalTone ?? null"
                        [attr.title]="cell?.note ?? null"
                        [attr.aria-label]="row.label + ', ' + col.label + ': ' + (cell ? cell.valueLabel : 'Empty')"
                        [attr.aria-disabled]="m.readOnly ? 'true' : null"
                        (click)="selectCell(track.id, row.id, col.id, cell)"
                      >
                        @if (cell) {
                          <span class="emr-stg__cell-val">{{ cell.valueLabel }}</span>
                          @if (cell.secondaryLabel) {
                            <span class="emr-stg__cell-sec">{{ cell.secondaryLabel }}</span>
                          }
                          @if (cell.badge) {
                            <span class="emr-stg__cell-badge" [attr.data-tone]="cell.badge.tone">
                              {{ cell.badge.label }}
                            </span>
                          }
                          @if (spark !== null) {
                            <span class="emr-stg__spark" aria-hidden="true">
                              <span
                                class="emr-stg__spark-fill"
                                [attr.data-tone]="cellTone(cell.abnormalTone)"
                                [style.width.%]="spark * 100"
                              ></span>
                            </span>
                          }
                          @if (cell.note) {
                            <span class="emr-stg__cell-note">{{ cell.note }}</span>
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
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; min-width: 0; max-width: 100%; color: var(--emr-text); font-family: var(--emr-font-family); font-variant-numeric: tabular-nums; container-type: inline-size; }
    .emr-stg { border: 1px solid var(--emr-border); border-radius: 12px; background: var(--emr-surface); overflow: hidden; min-width: 0; max-width: 100%; }
    .emr-stg__toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--emr-border); background: var(--emr-surface-soft); min-width: 0; }
    .emr-stg__title-wrap { min-width: 0; flex: 1 1 200px; }
    .emr-stg__title { margin: 0; font-size: var(--emr-text-md); font-weight: var(--emr-weight-bold); }
    .emr-stg__sub { margin: 2px 0 0; color: var(--emr-text-muted); font-size: var(--emr-text-xs); }
    .emr-stg__controls, .emr-stg__resolutions, .emr-stg__nav { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; min-width: 0; }
    .emr-stg__btn { min-height: 44px; min-width: 44px; padding: 6px 12px; border: 1px solid var(--emr-border); border-radius: 6px; background: var(--emr-surface); color: var(--emr-text); font: inherit; font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 4px; }
    .emr-stg__btn[aria-pressed="true"] { border-color: var(--emr-primary); background: var(--emr-primary-soft); color: var(--emr-primary-contrast); }
    .emr-stg__btn[aria-disabled="true"] { opacity: 0.5; cursor: not-allowed; }
    .emr-stg__offset-label { font-family: var(--emr-font-mono); font-size: var(--emr-text-xs); color: var(--emr-text-muted); }
    .emr-stg__scroll-viewport { overflow-x: auto; max-width: 100%; min-width: 0; overscroll-behavior-x: contain; -webkit-overflow-scrolling: touch; }
    .emr-stg__grid { width: max-content; min-width: 100%; }
    .emr-stg__axis-row, .emr-stg__row { display: grid; grid-template-columns: 124px repeat(var(--emr-stg-cols, 4), minmax(108px, 1fr)); border-bottom: 1px solid var(--emr-border); }
    .emr-stg__lead-cell, .emr-stg__row-lead { position: sticky; left: 0; z-index: 2; width: 124px; min-width: 124px; max-width: 124px; padding: 8px 10px; border-inline-end: 1px solid var(--emr-border); background: var(--emr-surface-raised); display: flex; flex-direction: column; justify-content: center; gap: 2px; }
    .emr-stg__lead-cell { font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); color: var(--emr-text-muted); }
    .emr-stg__col-head { min-width: 108px; min-height: 44px; padding: 6px 8px; border: 0; border-inline-end: 1px solid var(--emr-border); background: var(--emr-surface-raised); color: var(--emr-text); font: inherit; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; cursor: pointer; white-space: nowrap; }
    .emr-stg__col-head--current, .emr-stg__col-head--selected { background: var(--emr-primary-soft); }
    .emr-stg__col-label { font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); }
    .emr-stg__col-sub, .emr-stg__col-enc { font-size: var(--emr-text-2xs); color: var(--emr-text-muted); }
    .emr-stg__now { font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); color: var(--emr-primary); }
    .emr-stg__track-head { background: var(--emr-surface-accent); border-bottom: 1px solid var(--emr-border); }
    .emr-stg__track-toggle { width: 100%; min-height: 44px; padding: 8px 12px; border: 0; background: transparent; color: var(--emr-text); font: inherit; font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); display: flex; align-items: center; justify-content: space-between; gap: 8px; cursor: pointer; }
    .emr-stg__track-label-group { display: inline-flex; align-items: center; gap: 6px; position: sticky; left: 12px; }
    .emr-stg__track-kind { font-family: var(--emr-font-mono); font-size: var(--emr-text-2xs); color: var(--emr-text-muted); }
    .emr-stg__badge, .emr-stg__cell-badge { padding: 2px 7px; border-radius: 999px; background: var(--emr-neutral-soft); color: var(--emr-text); font-size: var(--emr-text-2xs); font-weight: var(--emr-weight-bold); white-space: nowrap; }
    .emr-stg__badge[data-tone="info"], .emr-stg__cell-badge[data-tone="info"] { background: var(--emr-info-soft); color: var(--emr-info); }
    .emr-stg__badge[data-tone="success"], .emr-stg__cell-badge[data-tone="success"] { background: var(--emr-success-soft); color: var(--emr-success); }
    .emr-stg__badge[data-tone="warning"], .emr-stg__cell-badge[data-tone="warning"] { background: var(--emr-warning-soft); color: var(--emr-warning); }
    .emr-stg__badge[data-tone="danger"], .emr-stg__cell-badge[data-tone="danger"] { background: var(--emr-danger-soft); color: var(--emr-danger); }
    .emr-stg__track-rows[data-collapsed="true"] { display: none; }
    .emr-stg__row-label { font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); overflow-wrap: anywhere; }
    .emr-stg__row-unit, .emr-stg__row-ref { font-size: var(--emr-text-2xs); color: var(--emr-text-muted); overflow-wrap: anywhere; }
    .emr-stg__cell { min-width: 108px; min-height: 44px; padding: 6px 8px; border: 0; border-inline-end: 1px solid var(--emr-border); background: var(--emr-surface); color: var(--emr-text); font: inherit; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; cursor: pointer; }
    .emr-stg__cell--selected { box-shadow: inset 0 0 0 2px var(--emr-primary); background: var(--emr-primary-soft); }
    .emr-stg__cell[data-tone="neutral"] { background: var(--emr-neutral-soft); color: var(--emr-text); }
    .emr-stg__cell[data-tone="info"] { background: var(--emr-info-soft); color: var(--emr-info); }
    .emr-stg__cell[data-tone="success"] { background: var(--emr-success-soft); color: var(--emr-success); }
    .emr-stg__cell[data-tone="warning"] { background: var(--emr-warning-soft); color: var(--emr-warning); }
    .emr-stg__cell[data-tone="danger"] { background: var(--emr-danger-soft); color: var(--emr-danger); }
    .emr-stg__cell-val { font-size: var(--emr-text-xs); font-weight: var(--emr-weight-bold); white-space: nowrap; }
    .emr-stg__cell-sec { font-size: var(--emr-text-2xs); color: var(--emr-text-muted); white-space: nowrap; }
    .emr-stg__cell-note { font-size: var(--emr-text-2xs); color: var(--emr-text-muted); max-width: 96px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .emr-stg__spark { width: 100%; max-width: 84px; height: 4px; border-radius: 999px; background: var(--emr-neutral-soft); overflow: hidden; }
    .emr-stg__spark-fill { display: block; height: 100%; border-radius: 999px; background: var(--emr-primary); }
    .emr-stg__spark-fill[data-tone="info"] { background: var(--emr-info); }
    .emr-stg__spark-fill[data-tone="success"] { background: var(--emr-success); }
    .emr-stg__spark-fill[data-tone="warning"] { background: var(--emr-warning); }
    .emr-stg__spark-fill[data-tone="danger"] { background: var(--emr-danger); }
    .emr-stg__cell-empty { color: var(--emr-text-muted); font-size: var(--emr-text-xs); }
    .emr-stg__btn:focus-visible, .emr-stg__col-head:focus-visible, .emr-stg__track-toggle:focus-visible, .emr-stg__cell:focus-visible { outline: 3px solid var(--emr-focus); outline-offset: -2px; }
    @media print {
      .emr-stg__controls { display: none !important; }
      .emr-stg__scroll-viewport { overflow: visible !important; max-width: none !important; }
      .emr-stg__lead-cell, .emr-stg__row-lead, .emr-stg__track-label-group { position: static !important; }
      .emr-stg__track-rows[data-collapsed="true"] { display: block !important; }
    }
    :host-context(.emr-print) .emr-stg__controls { display: none !important; }
    :host-context(.emr-print) .emr-stg__scroll-viewport { overflow: visible !important; max-width: none !important; }
    :host-context(.emr-print) .emr-stg__lead-cell,
    :host-context(.emr-print) .emr-stg__row-lead,
    :host-context(.emr-print) .emr-stg__track-label-group { position: static !important; }
    :host-context(.emr-print) .emr-stg__track-rows[data-collapsed="true"] { display: block !important; }
  `],
})
export class EmrSynchronizedTimeGridComponent {
  readonly model = input.required<EmrSynchronizedTimeGridViewModel>();
  readonly headingId = input<string>();
  readonly idPrefix = input<string>('');
  readonly labels = input<Partial<EmrSynchronizedTimeGridLabels>>({});
  readonly intent = output<EmrSynchronizedTimeGridIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  protected readonly resolvedLabels = computed(() => resolveSynchronizedTimeGridLabels(this.labels()));
  protected readonly resolvedId = computed(() =>
    resolveSynchronizedTimeGridId(this.model().id, this.idPrefix()),
  );
  protected readonly resolvedHeadingId = computed(() =>
    resolveSynchronizedTimeGridHeadingId(this.model().id, this.idPrefix(), this.headingId()),
  );

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private isFocusWithin = false;

  resolutions(): readonly EmrTimeGridResolution[] {
    return this.model().availableResolutions ?? TIME_GRID_DEFAULT_RESOLUTIONS;
  }

  visibleColumns(): readonly EmrTimeGridColumn[] {
    const m = this.model();
    return resolveTimeGridVisibleColumns(m.columns, m.scrollOffset, m.visibleColumnCount);
  }

  canStepEarlier(): boolean {
    const m = this.model();
    return !m.readOnly && canStepTimeGridScroll(m.scrollOffset, m.columns.length, m.visibleColumnCount, -1);
  }

  canStepLater(): boolean {
    const m = this.model();
    return !m.readOnly && canStepTimeGridScroll(m.scrollOffset, m.columns.length, m.visibleColumnCount, 1);
  }

  sparkNorm(value?: number): number | null {
    return clampSparklineNorm(value);
  }

  cellTone(tone?: EmrTimeGridCell['abnormalTone']) {
    return normalizeTone(tone);
  }

  isCellSelected(trackId: string, rowId: string, columnId: string): boolean {
    const sel = this.model().selectedCell;
    return !!sel && sel.trackId === trackId && sel.rowId === rowId && sel.columnId === columnId;
  }

  selectResolution(resolution: EmrTimeGridResolution): void {
    if (this.model().readOnly) return;
    this.intent.emit({ type: 'resolutionChanged', resolution });
  }

  stepScroll(delta: -1 | 1): void {
    const m = this.model();
    if (m.readOnly) return;
    if (!canStepTimeGridScroll(m.scrollOffset, m.columns.length, m.visibleColumnCount, delta)) return;
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

  protected onHostFocusIn(): void {
    if (!this.isFocusWithin) {
      this.isFocusWithin = true;
      this.focused.emit();
    }
  }

  protected onHostFocusOut(e: FocusEvent): void {
    const next = e.relatedTarget as Node | null;
    if (next && this.host.nativeElement.contains(next)) return;
    if (this.isFocusWithin) {
      this.isFocusWithin = false;
      this.blurred.emit();
    }
  }
}
