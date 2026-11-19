import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type {
  EmrFlatTreeRow,
  EmrMatchHighlightSegment,
  EmrSegmentedBadgePresentation,
  EmrTreeCheckStrategy,
  EmrTreeNode,
} from '@drguptavivek/emr-controller';
import {
  buildEmrTreeSelectSummary,
  clearTreeSelection,
  collectAllExpandableTreeIds,
  findNextTreeRowIndex,
  findTypeaheadTreeRowIndex,
  flattenVisibleTreeNodes,
  formatEmrSegmentedBadge,
  isEmrTreeClearable,
  removeTreeSelectionChip,
  resolveDefaultExpandedTreeIds,
  resolveEmrSelectCloseOnSelect,
  resolveEmrTreeSelectDefaultExpanded,
  splitMatchHighlightSegments,
  toggleTreeNodeCheck,
} from './emr-wave2.logic';

let nextTreeId = 0;

@Component({
  selector: 'emr-tree-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="emr-field" (focusin)="onFocusIn()" (focusout)="onFocusOut($event)">
      @if (label() || (!labelHidden() && (showExpandControls() || showClear()))) {
        <div class="emr-tree-view__toolbar">
          @if (label()) {
            <span
              class="emr-field__label"
              [class.emr-sr-only]="labelHidden()"
              [id]="resolvedId() + '-label'"
            >
              {{ label() }}
              @if (required()) {
                <span class="emr-field__required" aria-hidden="true">*</span>
              }
            </span>
          }
          @if (!labelHidden() && (showExpandControls() || showClear())) {
            <div class="emr-choice-header__actions" data-emr-print="hide">
              @if (showExpandControls()) {
                <button
                  type="button"
                  class="emr-choice-clear"
                  [disabled]="disabled()"
                  (click)="expandAll()"
                >
                  Expand all
                </button>
                <button
                  type="button"
                  class="emr-choice-clear"
                  [disabled]="disabled()"
                  (click)="collapseAll()"
                >
                  Collapse all
                </button>
              }
              @if (showClear()) {
                <button
                  type="button"
                  class="emr-choice-clear"
                  [attr.aria-label]="clearLabel() + ' ' + (label() || ariaLabel() || 'selection')"
                  (click)="clearAll()"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
                  </svg>
                  <span>{{ clearLabel() }}</span>
                </button>
              }
            </div>
          }
        </div>
      }
      @if (searchable()) {
        <div class="emr-search-select__input-wrap" data-emr-print="hide">
          <span class="emr-search-select__leading-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="20" y1="20" x2="16.2" y2="16.2" />
            </svg>
          </span>
          <input
            #searchInputEl
            class="emr-search-input"
            [class.emr-tree-view__search-input--has-clear]="!!activeSearchQuery()"
            style="padding-left: 36px; width: 100%;"
            type="search"
            autocomplete="off"
            [value]="activeSearchQuery()"
            [placeholder]="searchPlaceholder()"
            [disabled]="disabled()"
            [attr.aria-label]="(label() || ariaLabel() || 'Tree') + ' search'"
            (input)="onSearchInput($event)"
            (keydown.arrowdown)="onSearchArrowDown($event)"
          />
          @if (activeSearchQuery() && !disabled()) {
            <button
              type="button"
              class="emr-tree-view__search-clear"
              aria-label="Clear search"
              (click)="clearSearch()"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
              </svg>
            </button>
          }
        </div>
      }
      <div
        #treeRoot
        class="emr-tree-view"
        [class.emr-tree-view--sm]="size() === 'sm'"
        [style.max-height.px]="maxHeight()"
        data-emr-print="expand"
        role="tree"
        [id]="resolvedId()"
        [attr.aria-labelledby]="!ariaLabel() && !labelHidden() && label() ? resolvedId() + '-label' : null"
        [attr.aria-label]="ariaLabel() || (labelHidden() ? (label() || 'Tree view') : (!label() ? 'Tree view' : null))"
        [attr.aria-multiselectable]="multiple() ? 'true' : null"
        [attr.aria-required]="required() ? 'true' : null"
        [attr.aria-readonly]="readOnly() ? 'true' : null"
        [attr.aria-invalid]="isInvalid() ? 'true' : null"
        [attr.data-warning]="!isInvalid() && !!warning() ? 'true' : null"
        [attr.data-disabled]="disabled() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
      >
        @if (visibleRows().length === 0) {
          <div class="emr-empty" role="status">{{ emptyMessage() }}</div>
        }
        @for (row of visibleRows(); track row.node.id; let idx = $index) {
          <div
            class="emr-tree-view__row"
            role="treeitem"
            [style.padding-inline-start.px]="8 + row.depth * 20"
            [attr.data-node-id]="row.node.id"
            [attr.data-checked]="multiple() && row.checkState === 'checked' ? 'true' : null"
            [attr.data-mixed]="multiple() && row.checkState === 'mixed' ? 'true' : null"
            [attr.data-readonly]="row.node.readOnly ? 'true' : null"
            [attr.data-tone]="row.node.tone || null"
            [attr.tabindex]="disabled() ? -1 : (tabStopNodeId() === row.node.id ? 0 : -1)"
            [attr.aria-level]="row.depth + 1"
            [attr.aria-expanded]="row.hasChildren ? row.expanded : null"
            [attr.aria-selected]="isRowSelected(row)"
            [attr.aria-checked]="multiple() && showRowCheckbox(row) ? (row.checkState === 'checked' ? 'true' : row.checkState === 'mixed' ? 'mixed' : 'false') : null"
            [attr.aria-readonly]="readOnly() || row.node.readOnly ? 'true' : null"
            [attr.aria-disabled]="disabled() || !!row.node.disabled || null"
            (click)="onRowClick(row, $event)"
            (keydown)="onRowKeydown(row, idx, $event)"
          >
            @if (row.hasChildren) {
              <button
                type="button"
                class="emr-tree-view__toggle"
                tabindex="-1"
                [disabled]="disabled()"
                [attr.aria-label]="(row.expanded ? 'Collapse ' : 'Expand ') + row.node.label"
                (click)="onToggleNode(row.node.id, $event)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  @if (row.expanded) {
                    <polyline points="6 9 12 15 18 9" />
                  } @else {
                    <polyline points="9 18 15 12 9 6" />
                  }
                </svg>
              </button>
            } @else {
              <span class="emr-tree-view__spacer" aria-hidden="true"></span>
            }
            @if (multiple() && showRowCheckbox(row)) {
              <span class="emr-checkbox__box" aria-hidden="true">
                @if (row.checkState === 'mixed') {
                  <svg [attr.width]="size() === 'sm' ? 11 : 12" [attr.height]="size() === 'sm' ? 11 : 12" viewBox="0 0 16 16" fill="none">
                    <path d="M3.5 8h9" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                  </svg>
                } @else if (row.checkState === 'checked') {
                  <svg [attr.width]="size() === 'sm' ? 11 : 12" [attr.height]="size() === 'sm' ? 11 : 12" viewBox="0 0 16 16" fill="none">
                    <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                }
              </span>
            }
            @if (row.node.icon) {
              <span class="emr-tree-view__row-icon" aria-hidden="true">
                @switch (row.node.icon) {
                  @case ('eye') {
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                  }
                  @case ('lock') {
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                  }
                  @case ('warning') {
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 9 16H3Z" /><path d="M12 10v4M12 17h.01" /></svg>
                  }
                  @case ('info') {
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
                  }
                  @default {
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  }
                }
              </span>
            }
            <span class="emr-choice-option-copy">
              <span class="emr-choice-option-title">
                <span>
                  @for (seg of highlightSegments(row.node.label); track $index) {
                    @if (seg.matched) {
                      <mark class="emr-tree-view__match">{{ seg.text }}</mark>
                    } @else {
                      {{ seg.text }}
                    }
                  }
                </span>
                @if (row.node.code) {
                  <span class="emr-choice-option-desc">
                    (
                    @for (seg of highlightSegments(row.node.code); track $index) {
                      @if (seg.matched) {
                        <mark class="emr-tree-view__match">{{ seg.text }}</mark>
                      } @else {
                        {{ seg.text }}
                      }
                    }
                    )
                  </span>
                }
                @if (row.node.readOnly) {
                  <span class="emr-tree-view__lock" aria-label="Read-only node">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <rect x="4" y="11" width="16" height="10" rx="2" />
                      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    </svg>
                  </span>
                }
                @if (nodeBadge(row.node); as badge) {
                  <span [class]="'emr-badge emr-badge--sm emr-badge--' + badge.variant + ' emr-tone-' + badge.tone">{{ badge.text }}</span>
                }
              </span>
              @if (row.node.description) {
                <span class="emr-choice-option-desc">
                  @for (seg of highlightSegments(row.node.description); track $index) {
                    @if (seg.matched) {
                      <mark class="emr-tree-view__match">{{ seg.text }}</mark>
                    } @else {
                      {{ seg.text }}
                    }
                  }
                </span>
              }
            </span>
          </div>
        }
      </div>
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && warning()) {
        <span class="emr-field__warning" [id]="resolvedId() + '-warning'" role="status">{{ warning() }}</span>
      }
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'" role="alert">{{ error() }}</span>
      }
    </div>
  `,
})
export class EmrTreeViewComponent {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string>();
  readonly nodes = input<readonly EmrTreeNode[]>([]);
  readonly value = input<string | null>(null);
  readonly values = input<readonly string[]>([]);
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly checkStrategy = input<EmrTreeCheckStrategy>('cascade');
  readonly maxSelections = input<number>();
  readonly expandedIds = input<readonly string[] | undefined>(undefined);
  readonly defaultExpandedIds = input<readonly string[] | undefined>(undefined);
  readonly searchable = input(false, { transform: booleanAttribute });
  readonly searchQuery = input<string | undefined>(undefined);
  readonly searchPlaceholder = input('Filter hierarchy…');
  readonly highlightMatch = input(true, { transform: booleanAttribute });
  readonly showExpandControls = input(false, { transform: booleanAttribute });
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly clearLabel = input('Clear');
  readonly size = input<'md' | 'sm'>('md');
  readonly maxHeight = input(320);
  readonly emptyMessage = input('No matching items');
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly warning = input('');
  readonly error = input('');

  readonly valueChange = output<string | null>();
  readonly valuesChange = output<readonly string[]>();
  readonly expandedIdsChange = output<readonly string[]>();
  readonly searchQueryChange = output<string>();
  readonly nodeSelected = output<EmrTreeNode>();
  readonly cleared = output<void>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-tree-view-${++nextTreeId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly localExpandedIds = signal<readonly string[]>([]);
  protected readonly localSearchQuery = signal('');
  protected readonly focusedNodeId = signal<string | null>(null);
  private expandedInitialized = false;
  private isFocusedInside = false;
  private typeaheadBuffer = '';
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly isInvalid = computed(() => this.invalid() || Boolean(this.error()));

  protected readonly activeExpandedIds = computed(() => {
    const controlled = this.expandedIds();
    if (controlled !== undefined) return controlled;
    if (!this.expandedInitialized) {
      return resolveDefaultExpandedTreeIds(this.nodes(), this.defaultExpandedIds());
    }
    return this.localExpandedIds();
  });

  protected readonly activeSearchQuery = computed(() => {
    const controlled = this.searchQuery();
    return controlled !== undefined ? controlled : this.localSearchQuery();
  });

  protected readonly effectiveSelectedIds = computed<readonly string[]>(() => {
    if (this.multiple()) return this.values();
    const single = this.value();
    return single ? [single] : [];
  });

  protected readonly visibleRows = computed(() =>
    flattenVisibleTreeNodes(this.nodes(), this.activeExpandedIds(), {
      searchQuery: this.activeSearchQuery(),
      selectedIds: this.effectiveSelectedIds(),
      checkStrategy: this.checkStrategy(),
    }),
  );

  protected readonly showClear = computed(() =>
    isEmrTreeClearable({
      clearable: this.clearable(),
      disabled: this.disabled(),
      readOnly: this.readOnly(),
      multiple: this.multiple(),
      value: this.value(),
      values: this.values(),
      nodes: this.nodes(),
    }),
  );

  protected readonly tabStopNodeId = computed(() => {
    const rows = this.visibleRows();
    const focused = this.focusedNodeId();
    if (focused && rows.some((r) => r.node.id === focused && !r.node.disabled)) return focused;
    const selected = this.effectiveSelectedIds()[0];
    if (selected && rows.some((r) => r.node.id === selected && !r.node.disabled)) return selected;
    return rows.find((r) => !r.node.disabled)?.node.id ?? rows[0]?.node.id ?? null;
  });

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.warning()) ids.push(`${id}-warning`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly treeRootRef = viewChild<ElementRef<HTMLElement>>('treeRoot');
  private readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInputEl');

  focusSearchOrTree(): void {
    if (this.searchable()) {
      this.searchInputRef()?.nativeElement.focus();
      return;
    }
    const id = this.tabStopNodeId();
    if (id) this.focusNodeById(id);
  }

  protected showRowCheckbox(row: EmrFlatTreeRow): boolean {
    return row.selectable || this.checkStrategy() === 'cascade';
  }

  protected highlightSegments(text: string): readonly EmrMatchHighlightSegment[] {
    if (!this.highlightMatch() || !this.activeSearchQuery()) {
      return [{ text, matched: false }];
    }
    return splitMatchHighlightSegments(text, this.activeSearchQuery());
  }

  protected nodeBadge(node: EmrTreeNode): EmrSegmentedBadgePresentation | null {
    return formatEmrSegmentedBadge(node.badge, node.tone);
  }

  protected isRowSelected(row: EmrFlatTreeRow): boolean {
    if (this.multiple()) {
      return row.checkState === 'checked';
    }
    return this.value() === row.node.id;
  }

  protected onFocusIn(): void {
    if (!this.isFocusedInside) {
      this.isFocusedInside = true;
      this.focused.emit();
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const currentTarget = event.currentTarget as HTMLElement | null;
    const relatedTarget = event.relatedTarget as Node | null;
    if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
      return;
    }
    if (this.isFocusedInside) {
      this.isFocusedInside = false;
      this.blurred.emit();
    }
  }

  protected onSearchInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.localSearchQuery.set(next);
    this.searchQueryChange.emit(next);
  }

  protected clearSearch(): void {
    this.localSearchQuery.set('');
    this.searchQueryChange.emit('');
    this.searchInputRef()?.nativeElement.focus();
  }

  protected onSearchArrowDown(event: Event): void {
    const rows = this.visibleRows();
    const firstIdx = findNextTreeRowIndex(rows, -1, 'ArrowDown');
    if (firstIdx >= 0) {
      event.preventDefault();
      this.focusNodeById(rows[firstIdx]!.node.id);
    }
  }

  protected expandAll(): void {
    if (this.disabled()) return;
    const allIds = collectAllExpandableTreeIds(this.nodes());
    this.expandedInitialized = true;
    this.localExpandedIds.set(allIds);
    this.expandedIdsChange.emit(allIds);
  }

  protected collapseAll(): void {
    if (this.disabled()) return;
    this.expandedInitialized = true;
    this.localExpandedIds.set([]);
    this.expandedIdsChange.emit([]);
  }

  protected clearAll(): void {
    if (this.disabled() || this.readOnly()) return;
    if (this.multiple()) {
      const next = clearTreeSelection(this.nodes(), this.values());
      this.valuesChange.emit(next);
    } else {
      const current = this.value();
      const kept = current ? clearTreeSelection(this.nodes(), [current]) : [];
      this.valueChange.emit(kept[0] ?? null);
    }
    this.cleared.emit();
  }

  protected onToggleNode(nodeId: string, event?: Event): void {
    event?.stopPropagation();
    if (this.disabled()) return;
    const current = new Set(this.activeExpandedIds());
    if (current.has(nodeId)) current.delete(nodeId);
    else current.add(nodeId);
    const next = [...current];
    this.expandedInitialized = true;
    this.localExpandedIds.set(next);
    this.expandedIdsChange.emit(next);
  }

  protected onRowClick(row: EmrFlatTreeRow, event: MouseEvent): void {
    if (this.disabled() || row.node.disabled) {
      event.preventDefault();
      return;
    }
    this.focusedNodeId.set(row.node.id);
    if (!row.selectable && row.hasChildren && this.checkStrategy() !== 'cascade') {
      this.onToggleNode(row.node.id);
      return;
    }
    if (this.readOnly() || row.node.readOnly) return;
    this.activateRow(row);
  }

  protected onRowKeydown(row: EmrFlatTreeRow, index: number, event: KeyboardEvent): void {
    if (this.disabled()) return;
    const rows = this.visibleRows();
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Home':
      case 'End': {
        event.preventDefault();
        const nextIdx = findNextTreeRowIndex(rows, index, event.key);
        if (nextIdx >= 0) this.focusNodeById(rows[nextIdx]!.node.id);
        break;
      }
      case 'ArrowRight': {
        event.preventDefault();
        if (row.hasChildren && !row.expanded) {
          this.onToggleNode(row.node.id);
        } else if (row.hasChildren && row.expanded) {
          const nextIdx = findNextTreeRowIndex(rows, index, 'ArrowDown');
          if (nextIdx > index && rows[nextIdx]!.depth > row.depth) {
            this.focusNodeById(rows[nextIdx]!.node.id);
          }
        }
        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        if (row.hasChildren && row.expanded) {
          this.onToggleNode(row.node.id);
        } else if (row.parentId) {
          const parentRow = rows.find((r) => r.node.id === row.parentId);
          if (parentRow && !parentRow.node.disabled) {
            this.focusNodeById(parentRow.node.id);
          }
        }
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        if (!row.selectable && row.hasChildren && this.checkStrategy() !== 'cascade') {
          this.onToggleNode(row.node.id);
          return;
        }
        if (this.readOnly() || row.node.disabled || row.node.readOnly) return;
        this.activateRow(row);
        break;
      }
      default: {
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          this.typeaheadBuffer += event.key;
          if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
          this.typeaheadTimer = setTimeout(() => {
            this.typeaheadBuffer = '';
          }, 500);
          const matchIdx = findTypeaheadTreeRowIndex(rows, this.typeaheadBuffer, index);
          if (matchIdx >= 0) {
            this.focusNodeById(rows[matchIdx]!.node.id);
          }
        }
      }
    }
  }

  private activateRow(row: EmrFlatTreeRow): void {
    if (this.disabled() || this.readOnly() || row.node.disabled || row.node.readOnly) return;
    if (!row.selectable && !(this.multiple() && this.checkStrategy() === 'cascade')) return;
    this.nodeSelected.emit(row.node);
    if (this.multiple()) {
      const next = toggleTreeNodeCheck(
        this.nodes(),
        this.values(),
        row.node.id,
        this.checkStrategy(),
        this.maxSelections(),
      );
      if (next !== this.values()) {
        this.valuesChange.emit(next);
      }
    } else {
      const nextVal = this.clearable() && this.value() === row.node.id ? null : row.node.id;
      this.valueChange.emit(nextVal);
    }
  }

  private focusNodeById(nodeId: string): void {
    this.focusedNodeId.set(nodeId);
    const root = this.treeRootRef()?.nativeElement;
    if (!root) return;
    const rows = Array.from(root.querySelectorAll<HTMLElement>('[role="treeitem"]'));
    const target = rows.find((el) => el.getAttribute('data-node-id') === nodeId);
    target?.focus();
  }
}

@Component({
  selector: 'emr-tree-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <div
      [class]="fieldClasses()"
      (focusin)="onFocusIn()"
      (focusout)="onFocusOut($event)"
    >
      <label class="emr-field__label" [class.emr-sr-only]="labelHidden()" [for]="resolvedId()">
        {{ label() }}
        @if (required()) {
          <span class="emr-field__required" aria-hidden="true">*</span>
        }
      </label>
      <div class="emr-select-root">
        <div
          class="emr-select-shell"
          [attr.data-open]="isPanelOpen() ? 'true' : null"
          [attr.data-invalid]="isInvalid() ? 'true' : null"
          [attr.data-warning]="!isInvalid() && !!warning() ? 'true' : null"
          [attr.data-readonly]="readOnly() ? 'true' : null"
          [attr.data-disabled]="disabled() ? 'true' : null"
        >
          @if (multiple() && (summary().visibleChips.length > 0 || summary().overflowCount > 0)) {
            <div class="emr-select-chips" [attr.aria-label]="ariaLabel() || label() || 'Selected tree items'">
              @for (chip of summary().visibleChips; track chip.id) {
                <span
                  class="emr-select-chip"
                  [attr.data-readonly]="chip.readOnly ? 'true' : null"
                >
                  <span class="emr-select-chip__label">{{ chip.label }}</span>
                  @if (chip.readOnly) {
                    <span class="emr-tree-view__lock" aria-hidden="true">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="4" y="11" width="16" height="10" rx="2" />
                        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                      </svg>
                    </span>
                  } @else if (!readOnly() && !disabled() && !chip.disabled) {
                    <button
                      type="button"
                      class="emr-select-chip__remove"
                      [attr.aria-label]="'Remove ' + chip.label"
                      (click)="removeSelectedId(chip.id, $event)"
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
                      </svg>
                    </button>
                  }
                </span>
              }
              @if (summary().overflowCount > 0) {
                <span class="emr-select-chip emr-select-chip--overflow">+{{ summary().overflowCount }}</span>
              }
            </div>
          }
          <button
            #triggerBtn
            type="button"
            class="emr-select-trigger"
            role="combobox"
            [id]="resolvedId()"
            [disabled]="disabled()"
            [attr.aria-expanded]="isPanelOpen()"
            aria-haspopup="tree"
            [attr.aria-controls]="isPanelOpen() ? resolvedId() + '-panel' : null"
            [attr.aria-label]="resolvedAriaLabel()"
            [attr.aria-required]="required() ? 'true' : null"
            [attr.aria-readonly]="readOnly() ? 'true' : null"
            [attr.aria-invalid]="isInvalid() ? 'true' : null"
            [attr.aria-busy]="loading() ? 'true' : null"
            [attr.aria-describedby]="describedBy()"
            (click)="togglePanel()"
            (keydown)="onTriggerKeydown($event)"
          >
            @if (!multiple() || (!summary().visibleChips.length && summary().overflowCount === 0)) {
              <span
                class="emr-select-trigger__text"
                [class.emr-select-trigger__text--placeholder]="!summary().hasSelection"
              >
                {{ summary().text }}
              </span>
            } @else {
              <span class="emr-select-trigger__spacer" aria-hidden="true"></span>
            }
            <span class="emr-select-trigger__chevron" aria-hidden="true">
              @if (loading()) {
                <svg class="emr-select-spinner" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-opacity="0.25" stroke-width="2" />
                  <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              } @else {
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    [attr.d]="isPanelOpen() ? 'M4 10l4-4 4 4' : 'M4 6l4 4 4-4'"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              }
            </span>
          </button>
          @if (showClear()) {
            <button
              type="button"
              class="emr-select-clear"
              data-emr-print="hide"
              [attr.aria-label]="clearLabel() + ' ' + (label() || ariaLabel() || 'selection')"
              (click)="clearSelection($event)"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
              </svg>
            </button>
          }
        </div>
        @if (isPanelOpen()) {
          <div
            [id]="resolvedId() + '-panel'"
            class="emr-tree-select__panel"
            (keydown.escape)="closePanel($event)"
          >
            @if (showExpandControls()) {
              <div class="emr-choice-header__actions" data-emr-print="hide">
                <button type="button" class="emr-choice-clear" (click)="expandAll()">Expand all</button>
                <button type="button" class="emr-choice-clear" (click)="collapseAll()">Collapse all</button>
              </div>
            }
            @if (searchable()) {
              <div class="emr-search-select__input-wrap">
                <span class="emr-search-select__leading-icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="20" y1="20" x2="16.2" y2="16.2" />
                  </svg>
                </span>
                <input
                  #searchInput
                  class="emr-search-input"
                  [class.emr-tree-view__search-input--has-clear]="!!searchQuery()"
                  style="padding-left: 36px; width: 100%;"
                  type="search"
                  autocomplete="off"
                  [value]="searchQuery()"
                  [placeholder]="searchPlaceholder()"
                  [attr.aria-label]="(label() || ariaLabel() || 'Tree select') + ' filter'"
                  (input)="onSearchInput($event)"
                  (keydown.arrowdown)="onSearchArrowDown($event)"
                />
                @if (searchQuery()) {
                  <button
                    type="button"
                    class="emr-tree-view__search-clear"
                    aria-label="Clear filter"
                    (click)="clearSearch()"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
                    </svg>
                  </button>
                }
              </div>
            }
            <div
              #panelTree
              class="emr-tree-view"
              [class.emr-tree-view--sm]="size() === 'sm'"
              role="tree"
              [attr.aria-label]="(label() || ariaLabel() || 'Tree') + ' options'"
              [attr.aria-multiselectable]="multiple() ? 'true' : null"
            >
              @if (visibleRows().length === 0) {
                <div class="emr-empty" role="status">{{ emptyMessage() }}</div>
              }
              @for (row of visibleRows(); track row.node.id; let idx = $index) {
                <div
                  class="emr-tree-view__row"
                  role="treeitem"
                  [style.padding-inline-start.px]="8 + row.depth * 20"
                  [attr.data-node-id]="row.node.id"
                  [attr.data-checked]="multiple() && row.checkState === 'checked' ? 'true' : null"
                  [attr.data-mixed]="multiple() && row.checkState === 'mixed' ? 'true' : null"
                  [attr.data-readonly]="row.node.readOnly ? 'true' : null"
                  [attr.data-tone]="row.node.tone || null"
                  [attr.tabindex]="tabStopNodeId() === row.node.id ? 0 : -1"
                  [attr.aria-level]="row.depth + 1"
                  [attr.aria-expanded]="row.hasChildren ? row.expanded : null"
                  [attr.aria-selected]="isRowSelected(row)"
                  [attr.aria-checked]="multiple() && showRowCheckbox(row) ? (row.checkState === 'checked' ? 'true' : row.checkState === 'mixed' ? 'mixed' : 'false') : null"
                  [attr.aria-readonly]="row.node.readOnly ? 'true' : null"
                  [attr.aria-disabled]="!!row.node.disabled || null"
                  (click)="onRowClick(row, $event)"
                  (keydown)="onPanelRowKeydown(row, idx, $event)"
                >
                  @if (row.hasChildren) {
                    <button
                      type="button"
                      class="emr-tree-view__toggle"
                      tabindex="-1"
                      [attr.aria-label]="(row.expanded ? 'Collapse ' : 'Expand ') + row.node.label"
                      (click)="onToggleNode(row.node.id, $event)"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        @if (row.expanded) {
                          <polyline points="6 9 12 15 18 9" />
                        } @else {
                          <polyline points="9 18 15 12 9 6" />
                        }
                      </svg>
                    </button>
                  } @else {
                    <span class="emr-tree-view__spacer" aria-hidden="true"></span>
                  }
                  @if (multiple() && showRowCheckbox(row)) {
                    <span class="emr-checkbox__box" aria-hidden="true">
                      @if (row.checkState === 'mixed') {
                        <svg [attr.width]="size() === 'sm' ? 11 : 12" [attr.height]="size() === 'sm' ? 11 : 12" viewBox="0 0 16 16" fill="none">
                          <path d="M3.5 8h9" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                        </svg>
                      } @else if (row.checkState === 'checked') {
                        <svg [attr.width]="size() === 'sm' ? 11 : 12" [attr.height]="size() === 'sm' ? 11 : 12" viewBox="0 0 16 16" fill="none">
                          <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                      }
                    </span>
                  }
                  <span class="emr-choice-option-copy">
                    <span class="emr-choice-option-title">
                      <span>
                        @for (seg of highlightSegments(row.node.label); track $index) {
                          @if (seg.matched) {
                            <mark class="emr-tree-view__match">{{ seg.text }}</mark>
                          } @else {
                            {{ seg.text }}
                          }
                        }
                      </span>
                      @if (row.node.code) {
                        <span class="emr-choice-option-desc">({{ row.node.code }})</span>
                      }
                      @if (row.node.readOnly) {
                        <span class="emr-tree-view__lock" aria-label="Read-only node">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <rect x="4" y="11" width="16" height="10" rx="2" />
                            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                          </svg>
                        </span>
                      }
                      @if (nodeBadge(row.node); as badge) {
                        <span [class]="'emr-badge emr-badge--sm emr-badge--' + badge.variant + ' emr-tone-' + badge.tone">{{ badge.text }}</span>
                      }
                    </span>
                    @if (row.node.description) {
                      <span class="emr-choice-option-desc">{{ row.node.description }}</span>
                    }
                  </span>
                </div>
              }
            </div>
          </div>
        }
      </div>
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && warning()) {
        <span class="emr-field__warning" [id]="resolvedId() + '-warning'" role="status">{{ warning() }}</span>
      }
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'" role="alert">{{ error() }}</span>
      }
    </div>
  `,
})
export class EmrTreeSelectComponent {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string>();
  readonly placeholder = input('Select item…');
  readonly nodes = input<readonly EmrTreeNode[]>([]);
  readonly value = input<string | null>(null);
  readonly values = input<readonly string[]>([]);
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly checkStrategy = input<EmrTreeCheckStrategy>('cascade');
  readonly displayMode = input<'path' | 'leaf'>('path');
  readonly separator = input(' / ');
  readonly closeOnSelect = input<boolean | undefined>(undefined);
  readonly maxTagCount = input<number>();
  readonly maxSelections = input<number>();
  readonly expandedIds = input<readonly string[] | undefined>(undefined);
  readonly defaultExpandedIds = input<readonly string[] | undefined>(undefined);
  readonly searchable = input(true, { transform: booleanAttribute });
  readonly searchPlaceholder = input('Filter options…');
  readonly showExpandControls = input(false, { transform: booleanAttribute });
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly clearLabel = input('Clear');
  readonly variant = input<'outline' | 'filled' | 'subtle'>('outline');
  readonly size = input<'md' | 'sm'>('md');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly open = input<boolean | undefined>(undefined);
  readonly emptyMessage = input('No matching items');
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly warning = input('');
  readonly error = input('');

  readonly valueChange = output<string | null>();
  readonly valuesChange = output<readonly string[]>();
  readonly expandedIdsChange = output<readonly string[]>();
  readonly cleared = output<void>();
  readonly openChange = output<boolean>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly fallbackId = `emr-tree-select-${++nextTreeId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly localOpen = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly localExpandedIds = signal<readonly string[]>([]);
  protected readonly focusedNodeId = signal<string | null>(null);
  private expandedInit = false;
  private isFocusedInside = false;

  protected readonly isInvalid = computed(() => this.invalid() || Boolean(this.error()));

  protected readonly fieldClasses = computed(() => {
    const classes = ['emr-select-field', `emr-select-field--${this.variant()}`];
    if (this.size() === 'sm') classes.push('emr-select-field--sm');
    return classes.join(' ');
  });

  protected readonly resolvedAriaLabel = computed(() => {
    if (this.ariaLabel()) return this.ariaLabel()!;
    if (this.labelHidden()) return this.label() || 'Select item';
    return null;
  });

  protected readonly isPanelOpen = computed(() => {
    if (this.readOnly() || this.disabled()) return false;
    const controlled = this.open();
    return controlled !== undefined ? controlled : this.localOpen();
  });

  protected readonly activeExpandedIds = computed(() => {
    const controlled = this.expandedIds();
    if (controlled !== undefined) return controlled;
    if (!this.expandedInit) {
      return resolveEmrTreeSelectDefaultExpanded(
        this.nodes(),
        this.value(),
        this.values(),
        this.defaultExpandedIds(),
      );
    }
    return this.localExpandedIds();
  });

  protected readonly effectiveSelectedIds = computed<readonly string[]>(() => {
    if (this.multiple()) return this.values();
    const v = this.value();
    return v ? [v] : [];
  });

  protected readonly visibleRows = computed(() =>
    flattenVisibleTreeNodes(this.nodes(), this.activeExpandedIds(), {
      searchQuery: this.searchQuery(),
      selectedIds: this.effectiveSelectedIds(),
      checkStrategy: this.checkStrategy(),
    }),
  );

  protected readonly tabStopNodeId = computed(() => {
    const rows = this.visibleRows();
    const focused = this.focusedNodeId();
    if (focused && rows.some((r) => r.node.id === focused && !r.node.disabled)) return focused;
    const selected = this.effectiveSelectedIds()[0];
    if (selected && rows.some((r) => r.node.id === selected && !r.node.disabled)) return selected;
    return rows.find((r) => !r.node.disabled)?.node.id ?? rows[0]?.node.id ?? null;
  });

  protected readonly summary = computed(() =>
    buildEmrTreeSelectSummary({
      nodes: this.nodes(),
      multiple: this.multiple(),
      value: this.value(),
      values: this.values(),
      displayMode: this.displayMode(),
      separator: this.separator(),
      placeholder: this.placeholder(),
      maxTagCount: this.maxTagCount(),
    }),
  );

  protected readonly showClear = computed(() =>
    isEmrTreeClearable({
      clearable: this.clearable(),
      disabled: this.disabled(),
      readOnly: this.readOnly(),
      multiple: this.multiple(),
      value: this.value(),
      values: this.values(),
      nodes: this.nodes(),
    }),
  );

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.warning()) ids.push(`${id}-warning`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly triggerRef = viewChild<ElementRef<HTMLButtonElement>>('triggerBtn');
  private readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly panelTreeRef = viewChild<ElementRef<HTMLElement>>('panelTree');

  protected showRowCheckbox(row: EmrFlatTreeRow): boolean {
    return row.selectable || this.checkStrategy() === 'cascade';
  }

  protected highlightSegments(text: string): readonly EmrMatchHighlightSegment[] {
    if (!this.searchQuery()) {
      return [{ text, matched: false }];
    }
    return splitMatchHighlightSegments(text, this.searchQuery());
  }

  protected nodeBadge(node: EmrTreeNode): EmrSegmentedBadgePresentation | null {
    return formatEmrSegmentedBadge(node.badge, node.tone);
  }

  protected onFocusIn(): void {
    if (!this.isFocusedInside) {
      this.isFocusedInside = true;
      this.focused.emit();
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const currentTarget = event.currentTarget as HTMLElement | null;
    const relatedTarget = event.relatedTarget as Node | null;
    if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
      return;
    }
    if (this.isFocusedInside) {
      this.isFocusedInside = false;
      this.blurred.emit();
    }
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.isPanelOpen()) return;
    const target = event.target as Node | null;
    if (target && !this.hostRef.nativeElement.contains(target)) {
      this.setOpen(false);
    }
  }

  protected togglePanel(): void {
    if (this.readOnly() || this.disabled()) return;
    const next = !this.isPanelOpen();
    this.setOpen(next);
    if (next) {
      queueMicrotask(() => this.focusPanelEntry());
    }
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (this.readOnly() || this.disabled()) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      if (!this.isPanelOpen()) {
        event.preventDefault();
        this.setOpen(true);
        queueMicrotask(() => this.focusPanelEntry());
      }
    } else if (event.key === 'Escape' && this.isPanelOpen()) {
      this.closePanel(event);
    }
  }

  protected closePanel(event: Event): void {
    event.stopPropagation();
    this.setOpen(false);
    this.triggerRef()?.nativeElement.focus();
  }

  protected onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.searchInputRef()?.nativeElement.focus();
  }

  protected onSearchArrowDown(event: Event): void {
    const rows = this.visibleRows();
    const firstIdx = findNextTreeRowIndex(rows, -1, 'ArrowDown');
    if (firstIdx >= 0) {
      event.preventDefault();
      this.focusPanelNodeById(rows[firstIdx]!.node.id);
    }
  }

  protected expandAll(): void {
    const allIds = collectAllExpandableTreeIds(this.nodes());
    this.expandedInit = true;
    this.localExpandedIds.set(allIds);
    this.expandedIdsChange.emit(allIds);
  }

  protected collapseAll(): void {
    this.expandedInit = true;
    this.localExpandedIds.set([]);
    this.expandedIdsChange.emit([]);
  }

  protected onToggleNode(nodeId: string, event: Event): void {
    event.stopPropagation();
    const set = new Set(this.activeExpandedIds());
    if (set.has(nodeId)) set.delete(nodeId);
    else set.add(nodeId);
    const next = [...set];
    this.expandedInit = true;
    this.localExpandedIds.set(next);
    this.expandedIdsChange.emit(next);
  }

  protected isRowSelected(row: EmrFlatTreeRow): boolean {
    return this.multiple() ? row.checkState === 'checked' : this.value() === row.node.id;
  }

  protected onRowClick(row: EmrFlatTreeRow, event: MouseEvent): void {
    event.stopPropagation();
    if (row.node.disabled) return;
    this.focusedNodeId.set(row.node.id);
    if (!row.selectable && row.hasChildren && this.checkStrategy() !== 'cascade') {
      this.onToggleNode(row.node.id, event);
      return;
    }
    if (row.node.readOnly) return;
    this.selectRow(row);
  }

  protected onPanelRowKeydown(row: EmrFlatTreeRow, index: number, event: KeyboardEvent): void {
    const rows = this.visibleRows();
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Home':
      case 'End': {
        event.preventDefault();
        const nextIdx = findNextTreeRowIndex(rows, index, event.key);
        if (nextIdx >= 0) this.focusPanelNodeById(rows[nextIdx]!.node.id);
        break;
      }
      case 'ArrowRight': {
        event.preventDefault();
        if (row.hasChildren && !row.expanded) {
          this.onToggleNode(row.node.id, event);
        } else if (row.hasChildren && row.expanded) {
          const nextIdx = findNextTreeRowIndex(rows, index, 'ArrowDown');
          if (nextIdx > index && rows[nextIdx]!.depth > row.depth) {
            this.focusPanelNodeById(rows[nextIdx]!.node.id);
          }
        }
        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        if (row.hasChildren && row.expanded) {
          this.onToggleNode(row.node.id, event);
        } else if (row.parentId) {
          const parentRow = rows.find((r) => r.node.id === row.parentId);
          if (parentRow && !parentRow.node.disabled) {
            this.focusPanelNodeById(parentRow.node.id);
          }
        }
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        if (!row.selectable && row.hasChildren && this.checkStrategy() !== 'cascade') {
          this.onToggleNode(row.node.id, event);
          return;
        }
        if (row.node.disabled || row.node.readOnly) return;
        this.selectRow(row);
        break;
      }
    }
  }

  protected removeSelectedId(id: string, event: Event): void {
    event.stopPropagation();
    if (this.readOnly() || this.disabled()) return;
    const next = removeTreeSelectionChip(this.nodes(), this.values(), id, this.checkStrategy());
    if (next !== this.values()) {
      this.valuesChange.emit(next);
    }
  }

  protected clearSelection(event: Event): void {
    event.stopPropagation();
    if (this.readOnly() || this.disabled()) return;
    if (this.multiple()) {
      const next = clearTreeSelection(this.nodes(), this.values());
      this.valuesChange.emit(next);
    } else {
      const current = this.value();
      const kept = current ? clearTreeSelection(this.nodes(), [current]) : [];
      this.valueChange.emit(kept[0] ?? null);
    }
    this.cleared.emit();
  }

  private selectRow(row: EmrFlatTreeRow): void {
    if (this.readOnly() || this.disabled() || row.node.disabled || row.node.readOnly) return;
    if (!row.selectable && !(this.multiple() && this.checkStrategy() === 'cascade')) return;
    if (this.multiple()) {
      const next = toggleTreeNodeCheck(
        this.nodes(),
        this.values(),
        row.node.id,
        this.checkStrategy(),
        this.maxSelections(),
      );
      if (next !== this.values()) {
        this.valuesChange.emit(next);
      }
      if (resolveEmrSelectCloseOnSelect(true, this.closeOnSelect())) {
        this.setOpen(false);
        this.triggerRef()?.nativeElement.focus();
      }
    } else {
      this.valueChange.emit(row.node.id);
      if (resolveEmrSelectCloseOnSelect(false, this.closeOnSelect())) {
        this.setOpen(false);
        this.triggerRef()?.nativeElement.focus();
      }
    }
  }

  private focusPanelEntry(): void {
    if (this.searchable()) {
      this.searchInputRef()?.nativeElement.focus();
      return;
    }
    const id = this.tabStopNodeId();
    if (id) this.focusPanelNodeById(id);
  }

  private focusPanelNodeById(nodeId: string): void {
    this.focusedNodeId.set(nodeId);
    const root = this.panelTreeRef()?.nativeElement;
    if (!root) return;
    const rows = Array.from(root.querySelectorAll<HTMLElement>('[role="treeitem"]'));
    const target = rows.find((el) => el.getAttribute('data-node-id') === nodeId);
    target?.focus();
  }

  private setOpen(next: boolean): void {
    this.localOpen.set(next);
    if (!next) {
      this.searchQuery.set('');
    }
    this.openChange.emit(next);
  }
}
