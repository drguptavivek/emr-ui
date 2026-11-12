import {
  AfterViewChecked,
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
  viewChildren,
} from '@angular/core';
import type {
  EmrFlatTreeRow,
  EmrTreeCheckStrategy,
  EmrTreeNode,
} from '@drguptavivek/emr-controller';
import {
  collectAllExpandableTreeIds,
  flattenVisibleTreeNodes,
  formatTreeSelectionLabel,
  toggleTreeNodeCheck,
} from './emr-wave2.logic';

let nextTreeId = 0;

@Component({
  selector: 'emr-tree-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="emr-field">
      @if (label() || showExpandControls()) {
        <div class="emr-choice-header">
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
          @if (showExpandControls()) {
            <div class="emr-chip-row">
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
            </div>
          }
        </div>
      }
      @if (searchable()) {
        <input
          class="emr-search-input"
          type="search"
          autocomplete="off"
          [value]="activeSearchQuery()"
          [placeholder]="searchPlaceholder()"
          [disabled]="disabled()"
          [attr.aria-label]="(label() || 'Tree') + ' search'"
          (input)="onSearchInput($event)"
        />
      }
      <div
        class="emr-tree-view"
        role="tree"
        [id]="resolvedId()"
        [attr.aria-labelledby]="label() ? resolvedId() + '-label' : null"
        [attr.aria-label]="!label() ? ariaLabel() || 'Tree view' : null"
        [attr.aria-multiselectable]="multiple() || null"
        [attr.aria-readonly]="readOnly() || null"
        [attr.aria-invalid]="!!error() || null"
        [attr.aria-describedby]="describedBy()"
      >
        @if (visibleRows().length === 0) {
          <div class="emr-empty">{{ emptyMessage() }}</div>
        }
        @for (row of visibleRows(); track row.node.id; let idx = $index) {
          <div
            #treeRow
            class="emr-tree-view__row"
            role="treeitem"
            [style.padding-inline-start.px]="8 + row.depth * 20"
            [attr.data-node-id]="row.node.id"
            [attr.tabindex]="tabStopNodeId() === row.node.id ? 0 : -1"
            [attr.aria-level]="row.depth + 1"
            [attr.aria-expanded]="row.hasChildren ? row.expanded : null"
            [attr.aria-selected]="isRowSelected(row)"
            [attr.aria-checked]="multiple() ? row.checkState : null"
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
                {{ row.expanded ? '▾' : '▸' }}
              </button>
            } @else {
              <span class="emr-tree-view__spacer" aria-hidden="true"></span>
            }
            @if (multiple() && row.selectable) {
              <input
                #rowCheck
                type="checkbox"
                tabindex="-1"
                [attr.data-node-id]="row.node.id"
                [checked]="row.checkState === 'checked'"
                [indeterminate]="row.checkState === 'mixed'"
                [disabled]="disabled() || !!row.node.disabled"
                [attr.aria-label]="'Select ' + row.node.label"
                [attr.aria-readonly]="readOnly() || null"
                (click)="onCheckboxClick(row, $event)"
              />
            }
            <span class="emr-choice-option-copy">
              <span>
                @if (row.node.icon) {
                  <span aria-hidden="true">{{ row.node.icon }} </span>
                }
                {{ row.node.label }}
                @if (row.node.code) {
                  <span class="emr-choice-option-desc">({{ row.node.code }})</span>
                }
              </span>
              @if (row.node.description) {
                <span class="emr-choice-option-desc">{{ row.node.description }}</span>
              }
            </span>
          </div>
        }
      </div>
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'">{{ error() }}</span>
      }
    </div>
  `,
})
export class EmrTreeViewComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string>();
  readonly nodes = input<readonly EmrTreeNode[]>([]);
  readonly value = input<string | null>(null);
  readonly values = input<readonly string[]>([]);
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly checkStrategy = input<EmrTreeCheckStrategy>('cascade');
  readonly expandedIds = input<readonly string[] | undefined>(undefined);
  readonly searchable = input(false, { transform: booleanAttribute });
  readonly searchQuery = input<string | undefined>(undefined);
  readonly searchPlaceholder = input('Filter hierarchy…');
  readonly showExpandControls = input(false, { transform: booleanAttribute });
  readonly emptyMessage = input('No matching items');
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');

  readonly valueChange = output<string | null>();
  readonly valuesChange = output<readonly string[]>();
  readonly expandedIdsChange = output<readonly string[]>();
  readonly searchQueryChange = output<string>();
  readonly nodeSelected = output<EmrTreeNode>();

  private readonly fallbackId = `emr-tree-view-${++nextTreeId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly localExpandedIds = signal<readonly string[]>([]);
  protected readonly localSearchQuery = signal('');
  protected readonly focusedNodeId = signal<string | null>(null);
  private expandedInitialized = false;

  protected readonly activeExpandedIds = computed(() => {
    const controlled = this.expandedIds();
    if (controlled !== undefined) return controlled;
    if (!this.expandedInitialized) {
      return this.nodes()
        .filter((n) => n.children && n.children.length > 0)
        .map((n) => n.id);
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

  protected readonly tabStopNodeId = computed(() => {
    const rows = this.visibleRows();
    const focused = this.focusedNodeId();
    if (focused && rows.some((r) => r.node.id === focused)) return focused;
    const selected = this.effectiveSelectedIds()[0];
    if (selected && rows.some((r) => r.node.id === selected)) return selected;
    return rows.find((r) => !r.node.disabled)?.node.id ?? rows[0]?.node.id ?? null;
  });

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly rowRefs = viewChildren<ElementRef<HTMLElement>>('treeRow');
  private readonly checkRefs = viewChildren<ElementRef<HTMLInputElement>>('rowCheck');

  ngAfterViewChecked(): void {
    this.syncRowCheckboxes();
  }

  protected isRowSelected(row: EmrFlatTreeRow): boolean {
    if (this.multiple()) {
      return row.checkState === 'checked';
    }
    return this.value() === row.node.id;
  }

  protected onSearchInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.localSearchQuery.set(next);
    this.searchQueryChange.emit(next);
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

  protected onCheckboxClick(row: EmrFlatTreeRow, event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled() || this.readOnly() || row.node.disabled || !row.selectable) {
      event.preventDefault();
      this.syncRowCheckboxes();
      return;
    }
    this.activateRow(row);
  }

  protected onRowClick(row: EmrFlatTreeRow, event: MouseEvent): void {
    if (this.disabled() || row.node.disabled) {
      event.preventDefault();
      return;
    }
    this.focusedNodeId.set(row.node.id);
    if (!row.selectable && row.hasChildren) {
      this.onToggleNode(row.node.id);
      return;
    }
    if (this.readOnly()) return;
    this.activateRow(row);
  }

  protected onRowKeydown(row: EmrFlatTreeRow, index: number, event: KeyboardEvent): void {
    if (this.disabled()) return;
    const rows = this.visibleRows();
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        this.focusRowByIndex(Math.min(rows.length - 1, index + 1));
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        this.focusRowByIndex(Math.max(0, index - 1));
        break;
      }
      case 'Home': {
        event.preventDefault();
        this.focusRowByIndex(0);
        break;
      }
      case 'End': {
        event.preventDefault();
        this.focusRowByIndex(rows.length - 1);
        break;
      }
      case 'ArrowRight': {
        event.preventDefault();
        if (row.hasChildren && !row.expanded) {
          this.onToggleNode(row.node.id);
        } else if (row.hasChildren && row.expanded) {
          this.focusRowByIndex(Math.min(rows.length - 1, index + 1));
        }
        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        if (row.hasChildren && row.expanded) {
          this.onToggleNode(row.node.id);
        } else if (row.parentId) {
          const parentIdx = rows.findIndex((r) => r.node.id === row.parentId);
          if (parentIdx >= 0) this.focusRowByIndex(parentIdx);
        }
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        if (!row.selectable && row.hasChildren) {
          this.onToggleNode(row.node.id);
          return;
        }
        if (this.readOnly() || row.node.disabled) return;
        this.activateRow(row);
        break;
      }
    }
  }

  private activateRow(row: EmrFlatTreeRow): void {
    if (this.disabled() || this.readOnly() || row.node.disabled || !row.selectable) return;
    this.nodeSelected.emit(row.node);
    if (this.multiple()) {
      const next = toggleTreeNodeCheck(
        this.nodes(),
        this.values(),
        row.node.id,
        this.checkStrategy(),
      );
      this.valuesChange.emit(next);
      queueMicrotask(() => this.syncRowCheckboxes());
    } else {
      this.valueChange.emit(row.node.id);
    }
  }

  private focusRowByIndex(index: number): void {
    const rows = this.visibleRows();
    const target = rows[index];
    if (!target) return;
    this.focusedNodeId.set(target.node.id);
    const el = this.rowRefs()[index]?.nativeElement;
    el?.focus();
  }

  private syncRowCheckboxes(): void {
    const rowMap = new Map(this.visibleRows().map((r) => [r.node.id, r]));
    for (const ref of this.checkRefs()) {
      const el = ref.nativeElement;
      const nodeId = el.getAttribute('data-node-id') ?? '';
      const row = rowMap.get(nodeId);
      if (!row) continue;
      const expectedChecked = row.checkState === 'checked';
      const expectedMixed = row.checkState === 'mixed';
      if (el.checked !== expectedChecked) el.checked = expectedChecked;
      if (el.indeterminate !== expectedMixed) el.indeterminate = expectedMixed;
    }
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
    <div class="emr-field emr-search-select">
      <label class="emr-field__label" [class.emr-sr-only]="labelHidden()" [for]="resolvedId()">
        {{ label() }}
        @if (required()) {
          <span class="emr-field__required" aria-hidden="true">*</span>
        }
      </label>
      @if (multiple() && selectedChips().length > 0) {
        <div class="emr-chip-row" aria-label="Selected tree items">
          @for (chip of selectedChips(); track chip.id) {
            <span class="emr-chip emr-tone-neutral">
              {{ chip.label }}
              @if (!readOnly() && !disabled()) {
                <button
                  type="button"
                  class="emr-button emr-button--small emr-button--ghost"
                  [attr.aria-label]="'Remove ' + chip.label"
                  (click)="removeSelectedId(chip.id, $event)"
                >
                  ✕
                </button>
              }
            </span>
          }
        </div>
      }
      <div class="emr-search-select__bar">
        <button
          #triggerBtn
          type="button"
          class="emr-select"
          [id]="resolvedId()"
          [disabled]="disabled()"
          [attr.aria-expanded]="isPanelOpen()"
          [attr.aria-haspopup]="'tree'"
          [attr.aria-readonly]="readOnly() || null"
          [attr.aria-invalid]="!!error() || null"
          [attr.aria-describedby]="describedBy()"
          (click)="togglePanel()"
          (keydown.arrowdown)="openFromKeyboard($event)"
          (keydown.escape)="closePanel($event)"
        >
          {{ triggerDisplayText() }}
        </button>
        @if (showClear()) {
          <button
            type="button"
            class="emr-choice-clear"
            [attr.aria-label]="'Clear ' + (label() || 'selection')"
            (click)="clearSelection($event)"
          >
            ✕
          </button>
        }
      </div>
      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'">{{ error() }}</span>
      }
      @if (isPanelOpen()) {
        <div class="emr-search-select__panel" (keydown.escape)="closePanel($event)">
          @if (searchable()) {
            <input
              #searchInput
              class="emr-search-input"
              type="search"
              autocomplete="off"
              [value]="searchQuery()"
              [placeholder]="searchPlaceholder()"
              [attr.aria-label]="(label() || 'Tree select') + ' filter'"
              (input)="onSearchInput($event)"
            />
          }
          <div
            class="emr-tree-view"
            role="tree"
            [attr.aria-label]="(label() || 'Tree') + ' options'"
            [attr.aria-multiselectable]="multiple() || null"
          >
            @if (visibleRows().length === 0) {
              <div class="emr-empty">{{ emptyMessage() }}</div>
            }
            @for (row of visibleRows(); track row.node.id) {
              <div
                class="emr-tree-view__row"
                role="treeitem"
                tabindex="0"
                [style.padding-inline-start.px]="8 + row.depth * 20"
                [attr.data-node-id]="row.node.id"
                [attr.aria-level]="row.depth + 1"
                [attr.aria-expanded]="row.hasChildren ? row.expanded : null"
                [attr.aria-selected]="isRowSelected(row)"
                [attr.aria-checked]="multiple() ? row.checkState : null"
                [attr.aria-disabled]="!!row.node.disabled || null"
                (click)="onRowClick(row, $event)"
                (keydown.enter)="onRowKeyActivate(row, $event)"
                (keydown.space)="onRowKeyActivate(row, $event)"
              >
                @if (row.hasChildren) {
                  <button
                    type="button"
                    class="emr-tree-view__toggle"
                    tabindex="-1"
                    [attr.aria-label]="(row.expanded ? 'Collapse ' : 'Expand ') + row.node.label"
                    (click)="onToggleNode(row.node.id, $event)"
                  >
                    {{ row.expanded ? '▾' : '▸' }}
                  </button>
                } @else {
                  <span class="emr-tree-view__spacer" aria-hidden="true"></span>
                }
                @if (multiple() && row.selectable) {
                  <input
                    #panelCheck
                    type="checkbox"
                    tabindex="-1"
                    [attr.data-node-id]="row.node.id"
                    [checked]="row.checkState === 'checked'"
                    [indeterminate]="row.checkState === 'mixed'"
                    [disabled]="!!row.node.disabled"
                    [attr.aria-label]="'Select ' + row.node.label"
                    (click)="onCheckboxClick(row, $event)"
                  />
                }
                <span class="emr-choice-option-copy">
                  <span>
                    {{ row.node.label }}
                    @if (row.node.code) {
                      <span class="emr-choice-option-desc">({{ row.node.code }})</span>
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
  `,
})
export class EmrTreeSelectComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly placeholder = input('Select item…');
  readonly nodes = input<readonly EmrTreeNode[]>([]);
  readonly value = input<string | null>(null);
  readonly values = input<readonly string[]>([]);
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly checkStrategy = input<EmrTreeCheckStrategy>('cascade');
  readonly displayMode = input<'path' | 'leaf'>('path');
  readonly searchable = input(true, { transform: booleanAttribute });
  readonly searchPlaceholder = input('Filter options…');
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly open = input<boolean | undefined>(undefined);
  readonly emptyMessage = input('No matching items');
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');

  readonly valueChange = output<string | null>();
  readonly valuesChange = output<readonly string[]>();
  readonly cleared = output<void>();
  readonly openChange = output<boolean>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly fallbackId = `emr-tree-select-${++nextTreeId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly localOpen = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly expandedIds = signal<readonly string[]>([]);
  private expandedInit = false;

  protected readonly isPanelOpen = computed(() => {
    if (this.readOnly() || this.disabled()) return false;
    const controlled = this.open();
    return controlled !== undefined ? controlled : this.localOpen();
  });

  protected readonly activeExpandedIds = computed(() => {
    if (!this.expandedInit) {
      return collectAllExpandableTreeIds(this.nodes());
    }
    return this.expandedIds();
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

  protected readonly selectedChips = computed(() =>
    this.values().map((id) => ({
      id,
      label: formatTreeSelectionLabel(this.nodes(), id, this.displayMode()) || id,
    })),
  );

  protected readonly triggerDisplayText = computed(() => {
    if (this.multiple()) {
      const count = this.values().length;
      return count > 0 ? `${count} selected` : this.placeholder();
    }
    const val = this.value();
    if (!val) return this.placeholder();
    return formatTreeSelectionLabel(this.nodes(), val, this.displayMode()) || val;
  });

  protected readonly showClear = computed(() => {
    if (!this.clearable() || this.readOnly() || this.disabled()) return false;
    return this.multiple() ? this.values().length > 0 : Boolean(this.value());
  });

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly triggerRef = viewChild<ElementRef<HTMLButtonElement>>('triggerBtn');
  private readonly panelChecks = viewChildren<ElementRef<HTMLInputElement>>('panelCheck');

  ngAfterViewChecked(): void {
    const rowMap = new Map(this.visibleRows().map((r) => [r.node.id, r]));
    for (const ref of this.panelChecks()) {
      const el = ref.nativeElement;
      const nodeId = el.getAttribute('data-node-id') ?? '';
      const row = rowMap.get(nodeId);
      if (!row) continue;
      if (el.checked !== (row.checkState === 'checked')) {
        el.checked = row.checkState === 'checked';
      }
      if (el.indeterminate !== (row.checkState === 'mixed')) {
        el.indeterminate = row.checkState === 'mixed';
      }
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
    this.setOpen(!this.isPanelOpen());
  }

  protected openFromKeyboard(event: Event): void {
    if (this.readOnly() || this.disabled()) return;
    event.preventDefault();
    this.setOpen(true);
  }

  protected closePanel(event: Event): void {
    event.stopPropagation();
    this.setOpen(false);
    this.triggerRef()?.nativeElement.focus();
  }

  protected onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected onToggleNode(nodeId: string, event: Event): void {
    event.stopPropagation();
    const set = new Set(this.activeExpandedIds());
    if (set.has(nodeId)) set.delete(nodeId);
    else set.add(nodeId);
    this.expandedInit = true;
    this.expandedIds.set([...set]);
  }

  protected isRowSelected(row: EmrFlatTreeRow): boolean {
    return this.multiple() ? row.checkState === 'checked' : this.value() === row.node.id;
  }

  protected onCheckboxClick(row: EmrFlatTreeRow, event: MouseEvent): void {
    event.stopPropagation();
    if (this.readOnly() || this.disabled() || row.node.disabled || !row.selectable) {
      event.preventDefault();
      return;
    }
    this.selectRow(row);
  }

  protected onRowClick(row: EmrFlatTreeRow, event: MouseEvent): void {
    event.stopPropagation();
    if (row.node.disabled) return;
    if (!row.selectable && row.hasChildren) {
      this.onToggleNode(row.node.id, event);
      return;
    }
    this.selectRow(row);
  }

  protected onRowKeyActivate(row: EmrFlatTreeRow, event: Event): void {
    event.preventDefault();
    if (row.node.disabled) return;
    if (!row.selectable && row.hasChildren) {
      this.onToggleNode(row.node.id, event);
      return;
    }
    this.selectRow(row);
  }

  protected removeSelectedId(id: string, event: Event): void {
    event.stopPropagation();
    if (this.readOnly() || this.disabled()) return;
    const next = this.values().filter((v) => v !== id);
    this.valuesChange.emit(next);
  }

  protected clearSelection(event: Event): void {
    event.stopPropagation();
    if (this.readOnly() || this.disabled()) return;
    if (this.multiple()) {
      this.valuesChange.emit([]);
    } else {
      this.valueChange.emit(null);
    }
    this.cleared.emit();
  }

  private selectRow(row: EmrFlatTreeRow): void {
    if (this.readOnly() || this.disabled() || !row.selectable) return;
    if (this.multiple()) {
      const next = toggleTreeNodeCheck(
        this.nodes(),
        this.values(),
        row.node.id,
        this.checkStrategy(),
      );
      this.valuesChange.emit(next);
    } else {
      this.valueChange.emit(row.node.id);
      this.setOpen(false);
    }
  }

  private setOpen(next: boolean): void {
    this.localOpen.set(next);
    if (!next) {
      this.searchQuery.set('');
    }
    this.openChange.emit(next);
  }
}
