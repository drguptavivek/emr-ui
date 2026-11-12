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
import { Clipboard } from '@angular/cdk/clipboard';
import type {
  EmrAccordionItem,
  EmrBreadcrumbItem,
  EmrColorSwatch,
  EmrMenuItem,
} from '@drguptavivek/emr-controller';
import { emptyToNull } from './emr-inputs.logic';
import {
  DEFAULT_CLINICAL_COLOR_SWATCHES,
  collapseBreadcrumbs,
  toggleAccordionId,
} from './emr-wave2.logic';

let nextWave2NavId = 0;

@Component({
  selector: 'emr-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <div class="emr-menu-anchor" [id]="resolvedId()">
      <button
        #triggerBtn
        type="button"
        [class]="'emr-button emr-button--' + variant() + (size() === 'sm' ? ' emr-button--small' : '')"
        [disabled]="disabled()"
        [attr.aria-haspopup]="'menu'"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-controls]="resolvedId() + '-menu'"
        (click)="toggleMenu()"
        (keydown.arrowdown)="openAndFocusFirst($event)"
        (keydown.escape)="closeMenu($event)"
      >
        <span>{{ label() }}</span>
        <span aria-hidden="true">▾</span>
      </button>

      @if (isOpen()) {
        <div
          class="emr-menu__list"
          role="menu"
          [id]="resolvedId() + '-menu'"
          [attr.aria-label]="label()"
          (keydown.escape)="closeMenu($event)"
        >
          @for (item of items(); track item.id) {
            @if (item.dividerBefore) {
              <div class="emr-menu__divider" role="separator"></div>
            }
            <button
              #menuItemBtn
              type="button"
              class="emr-menu__item"
              [class.emr-menu__item--danger]="item.tone === 'danger'"
              role="menuitem"
              [disabled]="item.disabled"
              (click)="selectItem(item)"
              (keydown.arrowdown)="moveFocus($event, 1)"
              (keydown.arrowup)="moveFocus($event, -1)"
              (keydown.home)="focusByIndex($event, 0)"
              (keydown.end)="focusByIndex($event, enabledCount() - 1)"
            >
              <span class="emr-choice-option-copy">
                <span>
                  @if (item.icon) {
                    <span aria-hidden="true">{{ item.icon }} </span>
                  }
                  {{ item.label }}
                </span>
                @if (item.description) {
                  <span class="emr-choice-option-desc">{{ item.description }}</span>
                }
              </span>
              @if (item.shortcut) {
                <span class="emr-field__hint" aria-hidden="true">{{ item.shortcut }}</span>
              }
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class EmrMenuComponent {
  readonly controlId = input<string>();
  readonly label = input('Actions');
  readonly items = input<readonly EmrMenuItem[]>([]);
  readonly open = input<boolean | undefined>(undefined);
  readonly variant = input<'primary' | 'secondary' | 'outline' | 'ghost'>('outline');
  readonly size = input<'sm' | 'md'>('md');
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly itemSelected = output<EmrMenuItem>();
  readonly openChange = output<boolean>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly fallbackId = `emr-menu-${++nextWave2NavId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly localOpen = signal(false);
  protected readonly isOpen = computed(() => {
    if (this.disabled()) return false;
    const controlled = this.open();
    return controlled !== undefined ? controlled : this.localOpen();
  });

  protected readonly enabledCount = computed(
    () => this.items().filter((i) => !i.disabled).length,
  );

  private readonly triggerRef = viewChild<ElementRef<HTMLButtonElement>>('triggerBtn');
  private readonly itemBtns = viewChildren<ElementRef<HTMLButtonElement>>('menuItemBtn');

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    const target = event.target as Node | null;
    if (target && !this.hostRef.nativeElement.contains(target)) {
      this.setOpen(false);
    }
  }

  protected toggleMenu(): void {
    if (this.disabled()) return;
    this.setOpen(!this.isOpen());
  }

  protected openAndFocusFirst(event: Event): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.setOpen(true);
    queueMicrotask(() => {
      this.focusByIndex(event, 0);
    });
  }

  protected closeMenu(event: Event): void {
    event.stopPropagation();
    this.setOpen(false);
    this.triggerRef()?.nativeElement.focus();
  }

  protected selectItem(item: EmrMenuItem): void {
    if (this.disabled() || item.disabled) return;
    this.setOpen(false);
    this.itemSelected.emit(item);
  }

  protected moveFocus(event: Event, delta: -1 | 1): void {
    const enabled = this.itemBtns()
      .map((r) => r.nativeElement)
      .filter((b) => !b.disabled);
    const cur = enabled.indexOf(event.currentTarget as HTMLButtonElement);
    if (cur < 0) return;
    const next = (cur + delta + enabled.length) % enabled.length;
    this.focusByIndex(event, next);
  }

  protected focusByIndex(event: Event, index: number): void {
    const enabled = this.itemBtns()
      .map((r) => r.nativeElement)
      .filter((b) => !b.disabled);
    if (enabled.length === 0) return;
    event.preventDefault();
    const safeIdx = Math.max(0, Math.min(enabled.length - 1, index));
    enabled[safeIdx]?.focus();
  }

  private setOpen(next: boolean): void {
    this.localOpen.set(next);
    this.openChange.emit(next);
  }
}

@Component({
  selector: 'emr-split-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <div class="emr-split-button" [id]="resolvedId()" role="group" [attr.aria-label]="label()">
      <button
        type="button"
        [class]="'emr-button emr-button--' + variant()"
        [disabled]="disabled()"
        (click)="onPrimaryClick()"
      >
        {{ label() }}
      </button>
      <button
        #toggleBtn
        type="button"
        [class]="'emr-button emr-button--' + variant()"
        [disabled]="disabled()"
        [attr.aria-label]="menuLabel() || 'More ' + label() + ' options'"
        [attr.aria-haspopup]="'menu'"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-controls]="resolvedId() + '-menu'"
        (click)="toggleMenu()"
        (keydown.arrowdown)="openAndFocusFirst($event)"
        (keydown.escape)="closeMenu($event)"
      >
        ▾
      </button>

      @if (isOpen()) {
        <div
          class="emr-menu__list"
          role="menu"
          [id]="resolvedId() + '-menu'"
          [attr.aria-label]="menuLabel() || label() + ' options'"
          (keydown.escape)="closeMenu($event)"
        >
          @for (item of items(); track item.id) {
            @if (item.dividerBefore) {
              <div class="emr-menu__divider" role="separator"></div>
            }
            <button
              #menuItemBtn
              type="button"
              class="emr-menu__item"
              [class.emr-menu__item--danger]="item.tone === 'danger'"
              role="menuitem"
              [disabled]="item.disabled"
              (click)="selectItem(item)"
              (keydown.arrowdown)="moveFocus($event, 1)"
              (keydown.arrowup)="moveFocus($event, -1)"
            >
              <span>{{ item.label }}</span>
              @if (item.shortcut) {
                <span class="emr-field__hint" aria-hidden="true">{{ item.shortcut }}</span>
              }
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class EmrSplitButtonComponent {
  readonly controlId = input<string>();
  readonly label = input.required<string>();
  readonly menuLabel = input<string>();
  readonly items = input<readonly EmrMenuItem[]>([]);
  readonly variant = input<'primary' | 'secondary' | 'outline'>('primary');
  readonly open = input<boolean | undefined>(undefined);
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly clicked = output<void>();
  readonly itemSelected = output<EmrMenuItem>();
  readonly openChange = output<boolean>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly fallbackId = `emr-split-button-${++nextWave2NavId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly localOpen = signal(false);
  protected readonly isOpen = computed(() => {
    if (this.disabled()) return false;
    const controlled = this.open();
    return controlled !== undefined ? controlled : this.localOpen();
  });

  private readonly toggleRef = viewChild<ElementRef<HTMLButtonElement>>('toggleBtn');
  private readonly itemBtns = viewChildren<ElementRef<HTMLButtonElement>>('menuItemBtn');

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    const target = event.target as Node | null;
    if (target && !this.hostRef.nativeElement.contains(target)) {
      this.setOpen(false);
    }
  }

  protected onPrimaryClick(): void {
    if (this.disabled()) return;
    this.setOpen(false);
    this.clicked.emit();
  }

  protected toggleMenu(): void {
    if (this.disabled()) return;
    this.setOpen(!this.isOpen());
  }

  protected openAndFocusFirst(event: Event): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.setOpen(true);
    queueMicrotask(() => {
      const enabled = this.itemBtns()
        .map((r) => r.nativeElement)
        .filter((b) => !b.disabled);
      enabled[0]?.focus();
    });
  }

  protected closeMenu(event: Event): void {
    event.stopPropagation();
    this.setOpen(false);
    this.toggleRef()?.nativeElement.focus();
  }

  protected selectItem(item: EmrMenuItem): void {
    if (this.disabled() || item.disabled) return;
    this.setOpen(false);
    this.itemSelected.emit(item);
  }

  protected moveFocus(event: Event, delta: -1 | 1): void {
    const enabled = this.itemBtns()
      .map((r) => r.nativeElement)
      .filter((b) => !b.disabled);
    const cur = enabled.indexOf(event.currentTarget as HTMLButtonElement);
    if (cur < 0) return;
    event.preventDefault();
    const next = (cur + delta + enabled.length) % enabled.length;
    enabled[next]?.focus();
  }

  private setOpen(next: boolean): void {
    this.localOpen.set(next);
    this.openChange.emit(next);
  }
}

@Component({
  selector: 'emr-accordion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="emr-accordion" [id]="resolvedId()">
      @for (item of items(); track item.id; let idx = $index) {
        <div class="emr-accordion__item">
          <button
            #headerBtn
            type="button"
            class="emr-accordion__trigger"
            [id]="resolvedId() + '-header-' + item.id"
            [disabled]="disabled() || !!item.disabled"
            [attr.aria-expanded]="isExpanded(item.id)"
            [attr.aria-controls]="resolvedId() + '-panel-' + item.id"
            (click)="onToggle(item)"
            (keydown)="onHeaderKeydown(idx, $event)"
          >
            <span class="emr-choice-option-copy">
              <span>{{ item.title }}</span>
              @if (item.subtitle) {
                <span class="emr-choice-option-desc">{{ item.subtitle }}</span>
              }
            </span>
            <span class="emr-chip-row">
              @if (item.badge) {
                <span [class]="'emr-badge emr-tone-' + item.badge.tone">
                  {{ item.badge.label }}
                </span>
              }
              <span aria-hidden="true">{{ isExpanded(item.id) ? '▾' : '▸' }}</span>
            </span>
          </button>
          <div
            class="emr-accordion__panel"
            role="region"
            [id]="resolvedId() + '-panel-' + item.id"
            [attr.aria-labelledby]="resolvedId() + '-header-' + item.id"
            [hidden]="!isExpanded(item.id)"
          >
            @if (item.content) {
              <div>{{ item.content }}</div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class EmrAccordionComponent {
  readonly controlId = input<string>();
  readonly items = input<readonly EmrAccordionItem[]>([]);
  readonly expandedIds = input<readonly string[]>([]);
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly expandedIdsChange = output<readonly string[]>();
  readonly itemToggled = output<{ readonly id: string; readonly expanded: boolean }>();

  private readonly fallbackId = `emr-accordion-${++nextWave2NavId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  private readonly headerBtns = viewChildren<ElementRef<HTMLButtonElement>>('headerBtn');

  protected isExpanded(id: string): boolean {
    return this.expandedIds().includes(id);
  }

  protected onToggle(item: EmrAccordionItem): void {
    if (this.disabled() || item.disabled) return;
    const next = toggleAccordionId(this.expandedIds(), item.id, this.multiple());
    const expanded = next.includes(item.id);
    this.itemToggled.emit({ id: item.id, expanded });
    this.expandedIdsChange.emit(next);
  }

  protected onHeaderKeydown(index: number, event: KeyboardEvent): void {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const enabled = this.headerBtns()
      .map((r) => r.nativeElement)
      .filter((b) => !b.disabled);
    if (enabled.length === 0) return;
    const currentBtn = this.headerBtns()[index]?.nativeElement;
    const curIdx = currentBtn ? Math.max(0, enabled.indexOf(currentBtn)) : 0;
    const nextIdx =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? enabled.length - 1
          : event.key === 'ArrowDown'
            ? (curIdx + 1) % enabled.length
            : (curIdx - 1 + enabled.length) % enabled.length;
    event.preventDefault();
    enabled[nextIdx]?.focus();
  }
}

@Component({
  selector: 'emr-breadcrumbs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <nav [id]="resolvedId()" [attr.aria-label]="ariaLabel()">
      <ol class="emr-breadcrumbs">
        @for (item of displayedLeading(); track item.id; let isFirst = $first) {
          @if (!isFirst) {
            <li class="emr-field__hint" aria-hidden="true">{{ separator() }}</li>
          }
          <li>
            @if (isLastOverall(item.id)) {
              <span class="emr-breadcrumbs__current" aria-current="page">{{ item.label }}</span>
            } @else {
              <button
                type="button"
                class="emr-breadcrumbs__btn"
                [disabled]="item.disabled"
                (click)="onSelect(item)"
              >
                {{ item.label }}
              </button>
            }
          </li>
        }

        @if (hasHiddenItems()) {
          <li class="emr-field__hint" aria-hidden="true">{{ separator() }}</li>
          <li>
            <button
              type="button"
              class="emr-breadcrumbs__btn"
              aria-label="Show all breadcrumb levels"
              (click)="expanded.set(true)"
            >
              …
            </button>
          </li>
        }

        @for (item of displayedTrailing(); track item.id) {
          <li class="emr-field__hint" aria-hidden="true">{{ separator() }}</li>
          <li>
            @if (isLastOverall(item.id)) {
              <span class="emr-breadcrumbs__current" aria-current="page">{{ item.label }}</span>
            } @else {
              <button
                type="button"
                class="emr-breadcrumbs__btn"
                [disabled]="item.disabled"
                (click)="onSelect(item)"
              >
                {{ item.label }}
              </button>
            }
          </li>
        }
      </ol>
    </nav>
  `,
})
export class EmrBreadcrumbsComponent {
  readonly controlId = input<string>();
  readonly ariaLabel = input('Breadcrumb');
  readonly items = input<readonly EmrBreadcrumbItem[]>([]);
  readonly maxItems = input<number | undefined>(undefined);
  readonly separator = input('/');

  readonly itemSelected = output<EmrBreadcrumbItem>();

  private readonly fallbackId = `emr-breadcrumbs-${++nextWave2NavId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly expanded = signal(false);

  protected readonly collapsedState = computed(() =>
    this.expanded()
      ? { leading: this.items(), hidden: [], trailing: [] }
      : collapseBreadcrumbs(this.items(), this.maxItems()),
  );

  protected readonly displayedLeading = computed(() => this.collapsedState().leading);
  protected readonly displayedTrailing = computed(() => this.collapsedState().trailing);
  protected readonly hasHiddenItems = computed(() => this.collapsedState().hidden.length > 0);

  protected isLastOverall(id: string): boolean {
    const all = this.items();
    return all.length > 0 && all[all.length - 1]?.id === id;
  }

  protected onSelect(item: EmrBreadcrumbItem): void {
    if (item.disabled) return;
    this.itemSelected.emit(item);
  }
}

@Component({
  selector: 'emr-color-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="emr-field">
      <div [class.emr-choice-header]="showClear()">
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
        @if (showClear()) {
          <button
            type="button"
            class="emr-choice-clear"
            [attr.aria-label]="'Clear ' + (label() || 'color')"
            (click)="clearColor()"
          >
            Clear
          </button>
        }
      </div>

      <div
        class="emr-color-swatches"
        role="radiogroup"
        [id]="resolvedId()"
        [attr.aria-labelledby]="resolvedId() + '-label'"
        [attr.aria-readonly]="readOnly() || null"
        [attr.aria-invalid]="!!error() || null"
        [attr.aria-describedby]="describedBy()"
      >
        @for (swatch of swatches(); track swatch.value) {
          <button
            type="button"
            class="emr-color-swatch"
            role="radio"
            [style.background]="swatch.value"
            [disabled]="disabled()"
            [attr.aria-label]="swatch.label + ' (' + swatch.value + ')'"
            [attr.aria-checked]="isSelectedSwatch(swatch.value)"
            [attr.aria-readonly]="readOnly() || null"
            (click)="selectColor(swatch.value)"
          ></button>
        }
      </div>

      @if (allowCustomHex()) {
        <div class="emr-quantity">
          <input
            #hexInput
            class="emr-control"
            type="text"
            placeholder="#RRGGBB"
            [value]="value() ?? ''"
            [disabled]="disabled()"
            [readOnly]="readOnly()"
            [attr.aria-label]="(label() || 'Color') + ' hex value'"
            (input)="onHexInput($event)"
            (blur)="syncDom()"
          />
        </div>
      }

      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'">{{ error() }}</span>
      }
    </div>
  `,
})
export class EmrColorPickerComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input('Color');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly value = input<string | null>(null);
  readonly swatches = input<readonly EmrColorSwatch[]>(DEFAULT_CLINICAL_COLOR_SWATCHES);
  readonly allowCustomHex = input(false, { transform: booleanAttribute });
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');

  readonly valueChange = output<string | null>();
  readonly cleared = output<void>();

  private readonly fallbackId = `emr-color-picker-${++nextWave2NavId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly showClear = computed(
    () => Boolean(this.clearable() && this.value() && !this.readOnly() && !this.disabled()),
  );

  protected readonly describedBy = computed(() => {
    if (this.labelHidden()) return null;
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.hint()) ids.push(`${id}-hint`);
    if (this.error()) ids.push(`${id}-error`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly hexRef = viewChild<ElementRef<HTMLInputElement>>('hexInput');
  private needsDomSync = false;

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected isSelectedSwatch(swatchHex: string): boolean {
    return (this.value() ?? '').toLowerCase() === swatchHex.toLowerCase();
  }

  protected selectColor(hex: string): void {
    if (this.readOnly() || this.disabled()) return;
    this.scheduleDomSync();
    this.valueChange.emit(hex);
  }

  protected onHexInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncDom();
      return;
    }
    this.scheduleDomSync();
    this.valueChange.emit(emptyToNull(target.value));
  }

  protected clearColor(): void {
    if (this.readOnly() || this.disabled()) return;
    this.scheduleDomSync();
    this.valueChange.emit(null);
    this.cleared.emit();
  }

  private scheduleDomSync(): void {
    this.needsDomSync = true;
    queueMicrotask(() => {
      if (this.needsDomSync) {
        this.needsDomSync = false;
        this.syncDom();
      }
    });
  }

  protected syncDom(): void {
    const el = this.hexRef()?.nativeElement;
    if (!el) return;
    const expected = this.value() ?? '';
    if (el.value !== expected) el.value = expected;
  }
}

@Component({
  selector: 'emr-copy-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <span class="emr-chip-row" [id]="resolvedId()">
      <button
        type="button"
        [class]="'emr-button emr-button--' + variant() + (size() === 'sm' ? ' emr-button--small' : '')"
        [disabled]="disabled() || !value()"
        [attr.aria-label]="ariaLabel() || (copiedState() ? copiedLabel() : label())"
        (click)="onCopy()"
      >
        {{ copiedState() ? copiedLabel() : label() }}
      </button>
      <span class="emr-sr-only" role="status" aria-live="polite">
        {{ copiedState() ? copiedLabel() : '' }}
      </span>
    </span>
  `,
})
export class EmrCopyButtonComponent {
  readonly controlId = input<string>();
  readonly value = input.required<string>();
  readonly label = input('Copy');
  readonly copiedLabel = input('Copied');
  readonly ariaLabel = input<string>();
  readonly variant = input<'ghost' | 'outline' | 'secondary'>('outline');
  readonly size = input<'sm' | 'md'>('sm');
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly copied = output<string>();

  private readonly clipboard = inject(Clipboard, { optional: true });
  private readonly fallbackId = `emr-copy-button-${++nextWave2NavId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly copiedState = signal(false);

  protected onCopy(): void {
    const text = this.value();
    if (this.disabled() || !text) return;
    this.clipboard?.copy(text);
    this.copiedState.set(true);
    this.copied.emit(text);
  }
}
