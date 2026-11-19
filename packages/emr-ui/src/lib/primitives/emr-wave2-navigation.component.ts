import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import type {
  EmrAccordionItem,
  EmrBadge,
  EmrBreadcrumbItem,
  EmrColorSwatch,
  EmrMenuItem,
} from '@drguptavivek/emr-controller';
import {
  formatEmrBadgeCount,
  normalizeEmrBadgeShape,
  normalizeEmrBadgeSize,
  normalizeEmrBadgeTone,
  normalizeEmrBadgeVariant,
} from './emr-feedback.logic';
import {
  DEFAULT_CLINICAL_COLOR_SWATCHES,
  canClearEmrColorPicker,
  canCopyEmrValue,
  canOpenEmrMenu,
  canOpenEmrSplitMenu,
  canSelectEmrBreadcrumb,
  canSelectEmrMenuItem,
  canToggleAccordionItem,
  canTriggerEmrSplitPrimary,
  collapseBreadcrumbs,
  findEmrMenuTypeaheadIndex,
  formatCopyButtonLabel,
  getContrastCheckTone,
  moveAccordionFocusIndex,
  moveColorSwatchFocusIndex,
  moveEmrMenuFocusIndex,
  normalizeHexColor,
  resolveAccordionExpandedIds,
  resolveColorSwatchTabStopIndex,
  resolveCopyFeedbackDurationMs,
  resolveWave2NavIconPaths,
  toggleAccordionId,
} from './emr-wave2.logic';

let nextWave2NavId = 0;

@Component({
  selector: 'emr-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
  },
  template: `
    <div
      class="emr-menu-anchor"
      [id]="resolvedId()"
      (focusin)="onFocusIn()"
      (focusout)="onFocusOut($event)"
    >
      <button
        #triggerBtn
        type="button"
        [id]="resolvedId() + '-trigger'"
        [class]="'emr-button emr-button--' + variant() + (size() === 'sm' ? ' emr-button--small' : '')"
        [disabled]="disabled()"
        [attr.aria-label]="ariaLabel() || (!label() ? 'Actions' : null)"
        [attr.aria-haspopup]="'menu'"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-controls]="resolvedId() + '-menu'"
        [attr.aria-readonly]="readOnly() ? 'true' : null"
        (click)="toggleMenu()"
        (keydown)="onTriggerKeydown($event)"
      >
        @if (triggerIconPaths().length > 0) {
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            @for (d of triggerIconPaths(); track $index) {
              <path [attr.d]="d" />
            }
          </svg>
        }
        @if (label()) {
          <span>{{ label() }}</span>
        }
        <span
          class="emr-menu__trigger-chevron"
          [class.emr-menu__trigger-chevron--open]="isOpen()"
          aria-hidden="true"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            focusable="false"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      @if (isOpen()) {
        <div
          class="emr-menu__list"
          [class.emr-menu__list--end]="align() === 'end'"
          role="menu"
          [id]="resolvedId() + '-menu'"
          [attr.aria-labelledby]="resolvedId() + '-trigger'"
          [attr.aria-label]="ariaLabel() || label() || 'Menu'"
          (keydown)="onMenuKeydown($event)"
        >
          @for (item of items(); track item.id; let idx = $index) {
            @if (item.dividerBefore) {
              <div class="emr-menu__divider" role="separator"></div>
            }
            @let itemPaths = iconPaths(item.icon);
            <button
              #menuItemBtn
              type="button"
              class="emr-menu__item"
              [class.emr-menu__item--danger]="item.tone === 'danger'"
              role="menuitem"
              [disabled]="item.disabled"
              [attr.aria-disabled]="item.disabled ? 'true' : null"
              (click)="selectItem(item)"
              (keydown)="onItemKeydown(idx, $event)"
            >
              <span class="emr-menu__item-lead">
                @if (itemPaths.length > 0) {
                  <span class="emr-menu__item-icon" aria-hidden="true">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      focusable="false"
                    >
                      @for (d of itemPaths; track $index) {
                        <path [attr.d]="d" />
                      }
                    </svg>
                  </span>
                }
                <span class="emr-choice-option-copy">
                  <span>{{ item.label }}</span>
                  @if (item.description) {
                    <span class="emr-choice-option-desc">{{ item.description }}</span>
                  }
                </span>
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
  readonly label = input<string>('Actions');
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly triggerIcon = input<string | undefined>(undefined);
  readonly items = input<readonly EmrMenuItem[]>([]);
  readonly variant = input<'primary' | 'secondary' | 'outline' | 'ghost'>('outline');
  readonly size = input<'sm' | 'md'>('md');
  readonly align = input<'start' | 'end'>('start');
  readonly open = input<boolean | undefined>(undefined);
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly itemSelected = output<EmrMenuItem>();
  readonly openChange = output<boolean>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly fallbackId = `emr-menu-${++nextWave2NavId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly localOpen = signal(false);
  private defaultInitialized = false;
  private isFocusWithin = false;

  protected readonly triggerIconPaths = computed(() =>
    resolveWave2NavIconPaths(this.triggerIcon()),
  );

  protected readonly isOpen = computed(() => {
    if (!canOpenEmrMenu({ disabled: this.disabled(), readOnly: this.readOnly(), itemsCount: this.items().length })) {
      return false;
    }
    const controlled = this.open();
    return controlled !== undefined ? controlled : this.localOpen();
  });

  private readonly triggerRef = viewChild<ElementRef<HTMLButtonElement>>('triggerBtn');
  private readonly itemBtns = viewChildren<ElementRef<HTMLButtonElement>>('menuItemBtn');

  constructor() {
    effect(() => {
      const def = this.defaultOpen();
      if (!this.defaultInitialized) {
        this.defaultInitialized = true;
        if (def && untracked(() => this.open() === undefined)) {
          this.localOpen.set(true);
        }
      }
    });
  }

  protected iconPaths(name?: string): readonly string[] {
    return resolveWave2NavIconPaths(name);
  }

  protected onFocusIn(): void {
    if (!this.isFocusWithin) {
      this.isFocusWithin = true;
      this.focused.emit();
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && this.hostRef.nativeElement.contains(nextTarget)) return;
    if (this.isFocusWithin) {
      this.isFocusWithin = false;
      this.blurred.emit();
    }
  }

  protected onDocumentPointerDown(event: Event): void {
    if (!this.isOpen()) return;
    const target = event.target as Node | null;
    if (target && !this.hostRef.nativeElement.contains(target)) {
      this.setOpen(false);
    }
  }

  protected toggleMenu(): void {
    if (!canOpenEmrMenu({ disabled: this.disabled(), readOnly: this.readOnly(), itemsCount: this.items().length })) {
      return;
    }
    this.setOpen(!this.isOpen());
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (
      !canOpenEmrMenu({
        disabled: this.disabled(),
        readOnly: this.readOnly(),
        itemsCount: this.items().length,
      })
    ) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.openAndFocus('Home');
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.openAndFocus('End');
    } else if (event.key === 'Escape' && this.isOpen()) {
      event.preventDefault();
      event.stopPropagation();
      this.setOpen(false);
    }
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.setOpen(false);
      this.triggerRef()?.nativeElement.focus();
    } else if (event.key === 'Tab') {
      this.setOpen(false);
    }
  }

  protected onItemKeydown(index: number, event: KeyboardEvent): void {
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Home' ||
      event.key === 'End'
    ) {
      const nextIdx = moveEmrMenuFocusIndex(this.items(), index, event.key);
      if (nextIdx >= 0) {
        event.preventDefault();
        this.focusItemByIndex(nextIdx);
      }
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const matchIdx = findEmrMenuTypeaheadIndex(this.items(), event.key, index);
      if (matchIdx >= 0) {
        event.preventDefault();
        this.focusItemByIndex(matchIdx);
      }
    }
  }

  protected selectItem(item: EmrMenuItem): void {
    if (!canSelectEmrMenuItem(item, this.disabled(), this.readOnly())) return;
    this.setOpen(false);
    this.itemSelected.emit(item);
    this.triggerRef()?.nativeElement.focus();
  }

  private openAndFocus(edge: 'Home' | 'End'): void {
    this.setOpen(true);
    const targetIdx = moveEmrMenuFocusIndex(this.items(), -1, edge);
    if (targetIdx >= 0) {
      queueMicrotask(() => {
        this.focusItemByIndex(targetIdx);
      });
    }
  }

  private focusItemByIndex(index: number): void {
    this.itemBtns()[index]?.nativeElement.focus();
  }

  private setOpen(next: boolean): void {
    if (next && !canOpenEmrMenu({ disabled: this.disabled(), readOnly: this.readOnly(), itemsCount: this.items().length })) {
      return;
    }
    const wasOpen = this.isOpen();
    if (this.open() === undefined) {
      this.localOpen.set(next);
    }
    if (wasOpen !== next) {
      this.openChange.emit(next);
    }
  }
}

@Component({
  selector: 'emr-split-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
  },
  template: `
    <div
      class="emr-split-button"
      [id]="resolvedId()"
      role="group"
      [attr.aria-label]="label()"
      (focusin)="onFocusIn()"
      (focusout)="onFocusOut($event)"
    >
      <button
        type="button"
        [id]="resolvedId() + '-primary'"
        [class]="'emr-button emr-split-button__primary emr-button--' + variant() + sizeClass()"
        [disabled]="disabled() || loading()"
        [attr.aria-busy]="loading() ? 'true' : null"
        [attr.aria-readonly]="readOnly() ? 'true' : null"
        (click)="onPrimaryClick()"
      >
        @if (loading()) {
          <svg
            class="emr-split-button__spinner"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        }
        <span>{{ label() }}</span>
      </button>
      <button
        #toggleBtn
        type="button"
        [id]="resolvedId() + '-toggle'"
        [class]="'emr-button emr-split-button__toggle emr-button--' + variant() + sizeClass()"
        [disabled]="disabled() || loading()"
        [attr.aria-label]="menuLabel() || label() + ' options'"
        [attr.aria-haspopup]="'menu'"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-controls]="resolvedId() + '-menu'"
        [attr.aria-readonly]="readOnly() ? 'true' : null"
        (click)="toggleMenu()"
        (keydown)="onToggleKeydown($event)"
      >
        <span
          class="emr-menu__trigger-chevron"
          [class.emr-menu__trigger-chevron--open]="isOpen()"
          aria-hidden="true"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            focusable="false"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      @if (isOpen()) {
        <div
          class="emr-menu__list"
          [class.emr-menu__list--end]="align() === 'end'"
          role="menu"
          [id]="resolvedId() + '-menu'"
          [attr.aria-label]="menuLabel() || label() + ' options'"
          (keydown)="onMenuKeydown($event)"
        >
          @for (item of items(); track item.id; let idx = $index) {
            @if (item.dividerBefore) {
              <div class="emr-menu__divider" role="separator"></div>
            }
            @let itemPaths = iconPaths(item.icon);
            <button
              #menuItemBtn
              type="button"
              class="emr-menu__item"
              [class.emr-menu__item--danger]="item.tone === 'danger'"
              role="menuitem"
              [disabled]="item.disabled"
              [attr.aria-disabled]="item.disabled ? 'true' : null"
              (click)="selectItem(item)"
              (keydown)="onItemKeydown(idx, $event)"
            >
              <span class="emr-menu__item-lead">
                @if (itemPaths.length > 0) {
                  <span class="emr-menu__item-icon" aria-hidden="true">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.75"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      focusable="false"
                    >
                      @for (d of itemPaths; track $index) {
                        <path [attr.d]="d" />
                      }
                    </svg>
                  </span>
                }
                <span class="emr-choice-option-copy">
                  <span>{{ item.label }}</span>
                  @if (item.description) {
                    <span class="emr-choice-option-desc">{{ item.description }}</span>
                  }
                </span>
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
export class EmrSplitButtonComponent {
  readonly controlId = input<string>();
  readonly label = input.required<string>();
  readonly menuLabel = input<string | undefined>(undefined);
  readonly items = input<readonly EmrMenuItem[]>([]);
  readonly variant = input<'primary' | 'secondary' | 'outline' | 'danger'>('primary');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly align = input<'start' | 'end'>('end');
  readonly open = input<boolean | undefined>(undefined);
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly clicked = output<void>();
  readonly itemSelected = output<EmrMenuItem>();
  readonly openChange = output<boolean>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly fallbackId = `emr-split-button-${++nextWave2NavId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly localOpen = signal(false);
  private defaultInitialized = false;
  private isFocusWithin = false;

  protected readonly sizeClass = computed(() => {
    const s = this.size();
    return s === 'sm' ? ' emr-button--small' : s === 'lg' ? ' emr-button--large' : '';
  });

  protected readonly isOpen = computed(() => {
    if (
      !canOpenEmrSplitMenu({
        disabled: this.disabled(),
        readOnly: this.readOnly(),
        loading: this.loading(),
        itemsCount: this.items().length,
      })
    ) {
      return false;
    }
    const controlled = this.open();
    return controlled !== undefined ? controlled : this.localOpen();
  });

  private readonly toggleRef = viewChild<ElementRef<HTMLButtonElement>>('toggleBtn');
  private readonly itemBtns = viewChildren<ElementRef<HTMLButtonElement>>('menuItemBtn');

  constructor() {
    effect(() => {
      const def = this.defaultOpen();
      if (!this.defaultInitialized) {
        this.defaultInitialized = true;
        if (def && untracked(() => this.open() === undefined)) {
          this.localOpen.set(true);
        }
      }
    });
  }

  protected iconPaths(name?: string): readonly string[] {
    return resolveWave2NavIconPaths(name);
  }

  protected onFocusIn(): void {
    if (!this.isFocusWithin) {
      this.isFocusWithin = true;
      this.focused.emit();
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && this.hostRef.nativeElement.contains(nextTarget)) return;
    if (this.isFocusWithin) {
      this.isFocusWithin = false;
      this.blurred.emit();
    }
  }

  protected onDocumentPointerDown(event: Event): void {
    if (!this.isOpen()) return;
    const target = event.target as Node | null;
    if (target && !this.hostRef.nativeElement.contains(target)) {
      this.setOpen(false);
    }
  }

  protected onPrimaryClick(): void {
    if (
      !canTriggerEmrSplitPrimary({
        disabled: this.disabled(),
        readOnly: this.readOnly(),
        loading: this.loading(),
      })
    ) {
      return;
    }
    this.setOpen(false);
    this.clicked.emit();
  }

  protected toggleMenu(): void {
    if (
      !canOpenEmrSplitMenu({
        disabled: this.disabled(),
        readOnly: this.readOnly(),
        loading: this.loading(),
        itemsCount: this.items().length,
      })
    ) {
      return;
    }
    this.setOpen(!this.isOpen());
  }

  protected onToggleKeydown(event: KeyboardEvent): void {
    if (
      !canOpenEmrSplitMenu({
        disabled: this.disabled(),
        readOnly: this.readOnly(),
        loading: this.loading(),
        itemsCount: this.items().length,
      })
    ) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.openAndFocus('Home');
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.openAndFocus('End');
    } else if (event.key === 'Escape' && this.isOpen()) {
      event.preventDefault();
      event.stopPropagation();
      this.setOpen(false);
    }
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.setOpen(false);
      this.toggleRef()?.nativeElement.focus();
    } else if (event.key === 'Tab') {
      this.setOpen(false);
    }
  }

  protected onItemKeydown(index: number, event: KeyboardEvent): void {
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Home' ||
      event.key === 'End'
    ) {
      const nextIdx = moveEmrMenuFocusIndex(this.items(), index, event.key);
      if (nextIdx >= 0) {
        event.preventDefault();
        this.focusItemByIndex(nextIdx);
      }
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const matchIdx = findEmrMenuTypeaheadIndex(this.items(), event.key, index);
      if (matchIdx >= 0) {
        event.preventDefault();
        this.focusItemByIndex(matchIdx);
      }
    }
  }

  protected selectItem(item: EmrMenuItem): void {
    if (
      this.loading() ||
      !canSelectEmrMenuItem(item, this.disabled(), this.readOnly())
    ) {
      return;
    }
    this.setOpen(false);
    this.itemSelected.emit(item);
    this.toggleRef()?.nativeElement.focus();
  }

  private openAndFocus(edge: 'Home' | 'End'): void {
    this.setOpen(true);
    const targetIdx = moveEmrMenuFocusIndex(this.items(), -1, edge);
    if (targetIdx >= 0) {
      queueMicrotask(() => {
        this.focusItemByIndex(targetIdx);
      });
    }
  }

  private focusItemByIndex(index: number): void {
    this.itemBtns()[index]?.nativeElement.focus();
  }

  private setOpen(next: boolean): void {
    if (
      next &&
      !canOpenEmrSplitMenu({
        disabled: this.disabled(),
        readOnly: this.readOnly(),
        loading: this.loading(),
        itemsCount: this.items().length,
      })
    ) {
      return;
    }
    const wasOpen = this.isOpen();
    if (this.open() === undefined) {
      this.localOpen.set(next);
    }
    if (wasOpen !== next) {
      this.openChange.emit(next);
    }
  }
}

@Component({
  selector: 'emr-accordion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      [class]="'emr-accordion emr-accordion--' + variant() + (size() === 'sm' ? ' emr-accordion--sm' : '')"
      [id]="resolvedId()"
      (focusin)="onFocusIn()"
      (focusout)="onFocusOut($event)"
    >
      @for (item of items(); track item.id; let idx = $index) {
        @let expanded = isExpanded(item.id);
        @let itemIconPaths = iconPaths(item.icon);
        @let badgeView = resolveBadge(item.badge);
        <div class="emr-accordion__item">
          <div class="emr-accordion__heading" role="heading" [attr.aria-level]="headingLevel()">
            <button
              #headerBtn
              type="button"
              class="emr-accordion__trigger"
              [id]="resolvedId() + '-header-' + item.id"
              [disabled]="disabled() || !!item.disabled"
              [attr.aria-expanded]="expanded"
              [attr.aria-controls]="resolvedId() + '-panel-' + item.id"
              [attr.aria-readonly]="readOnly() ? 'true' : null"
              (click)="onToggle(item)"
              (keydown)="onHeaderKeydown(idx, $event)"
            >
              <span class="emr-accordion__title-row">
                @if (itemIconPaths.length > 0) {
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    @for (d of itemIconPaths; track $index) {
                      <path [attr.d]="d" />
                    }
                  </svg>
                }
                <span class="emr-choice-option-copy">
                  <span>{{ item.title }}</span>
                  @if (item.subtitle) {
                    <span class="emr-choice-option-desc">{{ item.subtitle }}</span>
                  }
                </span>
              </span>
              <span class="emr-chip-row">
                @if (badgeView) {
                  <span
                    [class]="badgeView.classes"
                    [attr.role]="badgeView.isDotOnly ? 'img' : null"
                    [attr.aria-label]="badgeView.isDotOnly ? (badgeView.assistiveText || 'Status indicator') : null"
                  >
                    @if (badgeView.dot && !badgeView.isDotOnly) {
                      <span class="emr-badge__dot" aria-hidden="true"></span>
                    }
                    @if (badgeView.countText !== null) {
                      <span class="emr-badge__count">{{ badgeView.countText }}</span>
                    } @else if (badgeView.label) {
                      <span>{{ badgeView.label }}</span>
                    }
                    @if (!badgeView.isDotOnly && badgeView.assistiveText) {
                      <span class="emr-sr-only"> {{ badgeView.assistiveText }}</span>
                    }
                  </span>
                }
                <span
                  class="emr-accordion__chevron"
                  [class.emr-accordion__chevron--open]="expanded"
                  aria-hidden="true"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    focusable="false"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </span>
            </button>
          </div>
          <div
            class="emr-accordion__panel"
            role="region"
            [id]="resolvedId() + '-panel-' + item.id"
            [attr.aria-labelledby]="resolvedId() + '-header-' + item.id"
            [hidden]="!expanded"
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
  readonly expandedIds = input<readonly string[] | undefined>(undefined);
  readonly defaultExpandedIds = input<readonly string[]>([]);
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly variant = input<'outlined' | 'flush' | 'card'>('outlined');
  readonly size = input<'sm' | 'md'>('md');
  readonly headingLevel = input<2 | 3 | 4 | 5 | 6>(3);
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly expandedIdsChange = output<readonly string[]>();
  readonly itemToggled = output<{ readonly id: string; readonly expanded: boolean }>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly fallbackId = `emr-accordion-${++nextWave2NavId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly localExpandedIds = signal<readonly string[]>([]);
  private defaultInitialized = false;
  private isFocusWithin = false;

  protected readonly activeExpandedIds = computed(() => {
    const raw = this.expandedIds() !== undefined ? this.expandedIds()! : this.localExpandedIds();
    return resolveAccordionExpandedIds(this.items(), raw, this.multiple());
  });

  private readonly headerBtns = viewChildren<ElementRef<HTMLButtonElement>>('headerBtn');

  constructor() {
    effect(() => {
      const def = this.defaultExpandedIds();
      if (!this.defaultInitialized) {
        this.defaultInitialized = true;
        if (def.length > 0 && untracked(() => this.expandedIds() === undefined)) {
          this.localExpandedIds.set(def);
        }
      }
    });
  }

  protected iconPaths(name?: string): readonly string[] {
    return resolveWave2NavIconPaths(name);
  }

  protected resolveBadge(badge?: EmrBadge) {
    if (!badge) return null;
    const tone = normalizeEmrBadgeTone(badge.tone);
    const variant = normalizeEmrBadgeVariant(badge.variant);
    const size = normalizeEmrBadgeSize(badge.size);
    const shape = normalizeEmrBadgeShape(badge.shape);
    const countInfo = formatEmrBadgeCount(badge.count, badge.maxCount ?? 99, Boolean(badge.showZero));
    const visible = countInfo.visible || Boolean(badge.label) || Boolean(badge.dot);
    if (!visible) return null;
    const isDotOnly = Boolean(badge.dot) && countInfo.text === null && !badge.label;
    const classes =
      `emr-badge emr-tone-${tone} emr-badge--${variant}` +
      (size === 'sm' ? ' emr-badge--sm' : '') +
      (shape === 'rounded' ? ' emr-badge--rounded' : '') +
      (isDotOnly ? ' emr-badge--dot-only' : '');
    return {
      classes,
      dot: Boolean(badge.dot),
      isDotOnly,
      countText: countInfo.text,
      label: badge.label,
      assistiveText: badge.assistiveText,
    };
  }

  protected isExpanded(id: string): boolean {
    return this.activeExpandedIds().includes(id);
  }

  protected onFocusIn(): void {
    if (!this.isFocusWithin) {
      this.isFocusWithin = true;
      this.focused.emit();
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && this.hostRef.nativeElement.contains(nextTarget)) return;
    if (this.isFocusWithin) {
      this.isFocusWithin = false;
      this.blurred.emit();
    }
  }

  protected onToggle(item: EmrAccordionItem): void {
    if (!canToggleAccordionItem(item, this.disabled(), this.readOnly())) return;
    const next = toggleAccordionId(this.activeExpandedIds(), item.id, this.multiple());
    if (this.expandedIds() === undefined) {
      this.localExpandedIds.set(next);
    }
    const expanded = next.includes(item.id);
    this.itemToggled.emit({ id: item.id, expanded });
    this.expandedIdsChange.emit(next);
  }

  protected onHeaderKeydown(index: number, event: KeyboardEvent): void {
    if (
      event.key !== 'ArrowDown' &&
      event.key !== 'ArrowUp' &&
      event.key !== 'Home' &&
      event.key !== 'End'
    ) {
      return;
    }
    if (this.disabled()) return;
    const nextIdx = moveAccordionFocusIndex(this.items(), index, event.key);
    if (nextIdx >= 0) {
      event.preventDefault();
      this.headerBtns()[nextIdx]?.nativeElement.focus();
    }
  }
}

@Component({
  selector: 'emr-breadcrumbs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <nav [id]="resolvedId()" [attr.aria-label]="ariaLabel() || 'Breadcrumb'">
      <ol [class]="'emr-breadcrumbs' + (size() === 'sm' ? ' emr-breadcrumbs--sm' : '')">
        @for (item of displayedLeading(); track item.id; let isFirst = $first) {
          @if (!isFirst) {
            <li class="emr-breadcrumbs__sep" aria-hidden="true">
              @if (separator() === 'chevron') {
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.75"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  focusable="false"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              } @else {
                {{ separator() }}
              }
            </li>
          }
          @let itemPaths = iconPaths(item.icon);
          <li class="emr-breadcrumbs__item">
            @if (isLastOverall(item.id)) {
              <span class="emr-breadcrumbs__current" aria-current="page">
                @if (itemPaths.length > 0) {
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    @for (d of itemPaths; track $index) {
                      <path [attr.d]="d" />
                    }
                  </svg>
                }
                <span class="emr-breadcrumbs__label">{{ item.label }}</span>
              </span>
            } @else if (item.href && !item.disabled) {
              <a
                #crumbBtn
                class="emr-breadcrumbs__btn"
                [attr.data-crumb-id]="item.id"
                [href]="item.href"
                (click)="onAnchorSelect($event, item)"
              >
                @if (itemPaths.length > 0) {
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    @for (d of itemPaths; track $index) {
                      <path [attr.d]="d" />
                    }
                  </svg>
                }
                <span class="emr-breadcrumbs__label">{{ item.label }}</span>
              </a>
            } @else {
              <button
                #crumbBtn
                type="button"
                class="emr-breadcrumbs__btn"
                [attr.data-crumb-id]="item.id"
                [disabled]="item.disabled"
                [attr.aria-disabled]="item.disabled ? 'true' : null"
                (click)="onSelect(item)"
              >
                @if (itemPaths.length > 0) {
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    @for (d of itemPaths; track $index) {
                      <path [attr.d]="d" />
                    }
                  </svg>
                }
                <span class="emr-breadcrumbs__label">{{ item.label }}</span>
              </button>
            }
          </li>
        }

        @if (hasHiddenItems()) {
          <li class="emr-breadcrumbs__sep" aria-hidden="true">
            @if (separator() === 'chevron') {
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
                focusable="false"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            } @else {
              {{ separator() }}
            }
          </li>
          <li class="emr-breadcrumbs__item">
            <button
              type="button"
              class="emr-breadcrumbs__btn"
              data-expand-breadcrumbs="true"
              [attr.aria-label]="'Show ' + hiddenCount() + ' hidden levels'"
              (click)="onExpandOverflow()"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0" />
                <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0" />
                <path d="M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0" />
              </svg>
            </button>
          </li>
        }

        @for (item of displayedTrailing(); track item.id) {
          <li class="emr-breadcrumbs__sep" aria-hidden="true">
            @if (separator() === 'chevron') {
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
                focusable="false"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            } @else {
              {{ separator() }}
            }
          </li>
          @let itemPaths = iconPaths(item.icon);
          <li class="emr-breadcrumbs__item">
            @if (isLastOverall(item.id)) {
              <span class="emr-breadcrumbs__current" aria-current="page">
                @if (itemPaths.length > 0) {
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    @for (d of itemPaths; track $index) {
                      <path [attr.d]="d" />
                    }
                  </svg>
                }
                <span class="emr-breadcrumbs__label">{{ item.label }}</span>
              </span>
            } @else if (item.href && !item.disabled) {
              <a
                #crumbBtn
                class="emr-breadcrumbs__btn"
                [attr.data-crumb-id]="item.id"
                [href]="item.href"
                (click)="onAnchorSelect($event, item)"
              >
                @if (itemPaths.length > 0) {
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    @for (d of itemPaths; track $index) {
                      <path [attr.d]="d" />
                    }
                  </svg>
                }
                <span class="emr-breadcrumbs__label">{{ item.label }}</span>
              </a>
            } @else {
              <button
                #crumbBtn
                type="button"
                class="emr-breadcrumbs__btn"
                [attr.data-crumb-id]="item.id"
                [disabled]="item.disabled"
                [attr.aria-disabled]="item.disabled ? 'true' : null"
                (click)="onSelect(item)"
              >
                @if (itemPaths.length > 0) {
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    @for (d of itemPaths; track $index) {
                      <path [attr.d]="d" />
                    }
                  </svg>
                }
                <span class="emr-breadcrumbs__label">{{ item.label }}</span>
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
  readonly ariaLabel = input<string>('Breadcrumb');
  readonly items = input<readonly EmrBreadcrumbItem[]>([]);
  readonly maxItems = input<number | undefined>(undefined);
  readonly separator = input<string>('/');
  readonly size = input<'sm' | 'md'>('md');

  readonly itemSelected = output<EmrBreadcrumbItem>();
  readonly overflowExpanded = output<readonly EmrBreadcrumbItem[]>();

  private readonly fallbackId = `emr-breadcrumbs-${++nextWave2NavId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly expanded = signal(false);

  private readonly crumbBtns = viewChildren<ElementRef<HTMLElement>>('crumbBtn');

  protected readonly collapsedState = computed(() =>
    this.expanded()
      ? { leading: this.items(), hidden: [], trailing: [] }
      : collapseBreadcrumbs(this.items(), this.maxItems()),
  );

  protected readonly displayedLeading = computed(() => this.collapsedState().leading);
  protected readonly displayedTrailing = computed(() => this.collapsedState().trailing);
  protected readonly hasHiddenItems = computed(() => this.collapsedState().hidden.length > 0);
  protected readonly hiddenCount = computed(() => this.collapsedState().hidden.length);

  constructor() {
    effect(() => {
      this.items();
      this.maxItems();
      this.expanded.set(false);
    });
  }

  protected iconPaths(name?: string): readonly string[] {
    return resolveWave2NavIconPaths(name);
  }

  protected isLastOverall(id: string): boolean {
    const all = this.items();
    return all.length > 0 && all[all.length - 1]?.id === id;
  }

  protected onExpandOverflow(): void {
    const hidden = this.collapsedState().hidden;
    const firstHidden = hidden.find((item) => !item.disabled);
    this.expanded.set(true);
    this.overflowExpanded.emit(hidden);
    if (firstHidden) {
      queueMicrotask(() => {
        const target = this.crumbBtns().find(
          (ref) => ref.nativeElement.getAttribute('data-crumb-id') === firstHidden.id,
        );
        target?.nativeElement.focus();
      });
    }
  }

  protected onAnchorSelect(event: MouseEvent, item: EmrBreadcrumbItem): void {
    if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
    }
    this.onSelect(item);
  }

  protected onSelect(item: EmrBreadcrumbItem): void {
    if (!canSelectEmrBreadcrumb(item, this.isLastOverall(item.id))) return;
    this.itemSelected.emit(item);
  }
}

@Component({
  selector: 'emr-color-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="emr-field"
      (focusin)="onFocusIn()"
      (focusout)="onFocusOut($event)"
    >
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
      </div>

      <div
        class="emr-color-swatches"
        role="radiogroup"
        [id]="resolvedId()"
        [attr.aria-label]="labelHidden() || !label() ? (label() || 'Color') : null"
        [attr.aria-labelledby]="!labelHidden() && label() ? resolvedId() + '-label' : null"
        [attr.aria-required]="required() ? 'true' : null"
        [attr.aria-readonly]="readOnly() ? 'true' : null"
        [attr.aria-invalid]="isInvalid() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
      >
        @for (swatch of swatches(); track swatch.value; let idx = $index) {
          @let selected = isSelectedSwatch(swatch.value);
          @let checkTone = contrastTone(swatch.value);
          <button
            #swatchBtn
            type="button"
            class="emr-color-swatch"
            [class.emr-color-swatch--sm]="size() === 'sm'"
            [class.emr-color-swatch--check-dark]="selected && checkTone === 'dark'"
            [class.emr-color-swatch--check-light]="selected && checkTone === 'light'"
            role="radio"
            [style.background]="swatch.value"
            [disabled]="disabled()"
            [tabIndex]="swatchTabIndex(idx)"
            [attr.aria-label]="swatch.label + ' (' + swatch.value + ')'"
            [attr.aria-checked]="selected"
            [attr.aria-readonly]="readOnly() ? 'true' : null"
            (click)="selectColor(swatch.value)"
            (keydown)="onSwatchKeydown(idx, $event)"
          >
            @if (selected) {
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.25"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            }
          </button>
        }
      </div>

      @if (allowCustomHex() || showClear()) {
        <div class="emr-color-hex-row">
          @if (allowCustomHex()) {
            <span
              class="emr-color-preview-dot"
              [style.background]="normalizedValue() || null"
              aria-hidden="true"
            ></span>
            <input
              #hexInput
              [class]="'emr-control emr-color-hex-input' + (size() === 'sm' ? ' emr-control--sm' : '')"
              type="text"
              placeholder="#RRGGBB"
              maxlength="7"
              [value]="hexDraft()"
              [disabled]="disabled()"
              [readOnly]="readOnly()"
              [attr.aria-label]="(label() || 'Color') + ' hex code'"
              [attr.aria-invalid]="isInvalid() || draftInvalid() ? 'true' : null"
              [attr.aria-describedby]="describedBy()"
              (input)="onHexInput($event)"
              (blur)="onHexBlur()"
            />
          }
          @if (showClear()) {
            <button
              type="button"
              class="emr-color-clear"
              data-emr-print="hide"
              [attr.aria-label]="'Clear ' + (label() || 'color')"
              (click)="clearColor()"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M18 6 6 18" />
                <path d="M6 6l12 12" />
              </svg>
              <span>Clear</span>
            </button>
          }
        </div>
      }

      @if (error()) {
        <span class="emr-field__error" role="alert" [id]="resolvedId() + '-error'">{{ error() }}</span>
      }
      @if (warning() && !isInvalid()) {
        <span class="emr-field__warning" role="status" [id]="resolvedId() + '-warning'">{{ warning() }}</span>
      }
      @if (hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
    </div>
  `,
})
export class EmrColorPickerComponent implements AfterViewChecked {
  readonly controlId = input<string>();
  readonly label = input<string>('Color');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly value = input<string | null>(null);
  readonly swatches = input<readonly EmrColorSwatch[]>(DEFAULT_CLINICAL_COLOR_SWATCHES);
  readonly allowCustomHex = input(true, { transform: booleanAttribute });
  readonly clearable = input(true, { transform: booleanAttribute });
  readonly size = input<'sm' | 'md'>('md');
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly hint = input<string>('');
  readonly warning = input<string>('');
  readonly error = input<string>('');

  readonly valueChange = output<string | null>();
  readonly cleared = output<void>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly fallbackId = `emr-color-picker-${++nextWave2NavId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly hexDraft = signal('');
  protected readonly draftInvalid = signal(false);
  private isFocusWithin = false;

  protected readonly normalizedValue = computed(() => normalizeHexColor(this.value()));
  protected readonly isInvalid = computed(() => Boolean(this.invalid() || this.error()));
  protected readonly tabStopIndex = computed(() =>
    resolveColorSwatchTabStopIndex(this.swatches(), this.value(), this.disabled()),
  );
  protected readonly showClear = computed(() =>
    canClearEmrColorPicker({
      clearable: this.clearable(),
      value: this.value(),
      disabled: this.disabled(),
      readOnly: this.readOnly(),
    }),
  );

  protected readonly describedBy = computed(() => {
    const id = this.resolvedId();
    const ids: string[] = [];
    if (this.error()) ids.push(`${id}-error`);
    if (this.warning() && !this.isInvalid()) ids.push(`${id}-warning`);
    if (this.hint()) ids.push(`${id}-hint`);
    return ids.length ? ids.join(' ') : null;
  });

  private readonly hexRef = viewChild<ElementRef<HTMLInputElement>>('hexInput');
  private readonly swatchBtns = viewChildren<ElementRef<HTMLButtonElement>>('swatchBtn');
  private needsDomSync = false;

  constructor() {
    effect(() => {
      const v = this.value();
      const locked = this.readOnly() || this.disabled();
      const expected = normalizeHexColor(v) ?? v ?? '';
      if (locked || !this.draftInvalid()) {
        this.hexDraft.set(expected);
        this.draftInvalid.set(false);
        this.needsDomSync = true;
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.needsDomSync) {
      this.needsDomSync = false;
      this.syncDom();
    }
  }

  protected onFocusIn(): void {
    if (!this.isFocusWithin) {
      this.isFocusWithin = true;
      this.focused.emit();
    }
  }

  protected onFocusOut(event: FocusEvent): void {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && this.hostRef.nativeElement.contains(nextTarget)) return;
    if (this.isFocusWithin) {
      this.isFocusWithin = false;
      this.blurred.emit();
    }
  }

  protected swatchTabIndex(idx: number): number {
    if (this.disabled()) return -1;
    return idx === this.tabStopIndex() ? 0 : -1;
  }

  protected contrastTone(hex: string): 'light' | 'dark' {
    return getContrastCheckTone(hex);
  }

  protected isSelectedSwatch(swatchHex: string): boolean {
    const active = this.normalizedValue();
    const swatchNorm = normalizeHexColor(swatchHex);
    return Boolean(active && swatchNorm && active === swatchNorm);
  }

  protected selectColor(hex: string): void {
    if (this.readOnly() || this.disabled()) return;
    const normalized = normalizeHexColor(hex) ?? hex;
    this.hexDraft.set(normalized);
    this.draftInvalid.set(false);
    this.scheduleDomSync();
    this.valueChange.emit(normalized);
  }

  protected onSwatchKeydown(index: number, event: KeyboardEvent): void {
    if (
      event.key !== 'ArrowLeft' &&
      event.key !== 'ArrowRight' &&
      event.key !== 'ArrowUp' &&
      event.key !== 'ArrowDown' &&
      event.key !== 'Home' &&
      event.key !== 'End'
    ) {
      return;
    }
    const nextIdx = moveColorSwatchFocusIndex(this.swatches(), index, event.key, this.disabled());
    if (nextIdx < 0) return;
    event.preventDefault();
    this.swatchBtns()[nextIdx]?.nativeElement.focus();
    const targetSwatch = this.swatches()[nextIdx];
    if (targetSwatch && !this.readOnly() && !this.disabled()) {
      this.selectColor(targetSwatch.value);
    }
  }

  protected onHexInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (this.readOnly() || this.disabled()) {
      this.syncDom();
      return;
    }
    const raw = target.value;
    this.hexDraft.set(raw);
    if (!raw.trim()) {
      this.draftInvalid.set(false);
      if (this.clearable()) {
        this.valueChange.emit(null);
        this.cleared.emit();
      }
      return;
    }
    const normalized = normalizeHexColor(raw);
    if (normalized) {
      this.draftInvalid.set(false);
      this.valueChange.emit(normalized);
    } else {
      this.draftInvalid.set(true);
    }
  }

  protected onHexBlur(): void {
    const expected = this.normalizedValue() ?? this.value() ?? '';
    this.hexDraft.set(expected);
    this.draftInvalid.set(false);
    this.syncDom();
  }

  protected clearColor(): void {
    if (this.readOnly() || this.disabled()) return;
    this.hexDraft.set('');
    this.draftInvalid.set(false);
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
    const expected = this.hexDraft();
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
        [class]="
          'emr-button emr-copy-button emr-button--' +
          variant() +
          (size() === 'sm' ? ' emr-button--small' : size() === 'lg' ? ' emr-button--large' : '') +
          (copiedState() ? ' emr-copy-button--copied' : '') +
          (iconOnly() ? ' emr-copy-button--icon-only' : '')
        "
        [disabled]="!canCopy()"
        [attr.data-copied]="copiedState() ? 'true' : 'false'"
        [attr.aria-label]="resolvedAriaLabel()"
        (click)="onCopy()"
        (focus)="focused.emit()"
        (blur)="blurred.emit()"
      >
        @if (copiedState()) {
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        } @else {
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M9 9h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2z" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        }
        @if (!iconOnly()) {
          <span>{{ displayLabel() }}</span>
        }
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
  readonly label = input<string>('Copy');
  readonly copiedLabel = input<string>('Copied');
  readonly iconOnly = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly variant = input<'primary' | 'secondary' | 'outline' | 'ghost'>('outline');
  readonly size = input<'sm' | 'md' | 'lg'>('sm');
  readonly feedbackDurationMs = input<number>(2000);
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly copied = output<string>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly clipboard = inject(Clipboard, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly fallbackId = `emr-copy-button-${++nextWave2NavId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly copiedState = signal(false);
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly canCopy = computed(() => canCopyEmrValue(this.value(), this.disabled()));
  protected readonly displayLabel = computed(() =>
    formatCopyButtonLabel(this.copiedState(), this.label(), this.copiedLabel()),
  );
  protected readonly resolvedAriaLabel = computed(
    () => this.ariaLabel() || this.displayLabel(),
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.clearCopyTimer());
    effect(() => {
      this.value();
      this.clearCopyTimer();
      this.copiedState.set(false);
    });
  }

  protected onCopy(): void {
    const text = this.value();
    if (!canCopyEmrValue(text, this.disabled())) return;
    this.clipboard?.copy(text);
    this.copiedState.set(true);
    this.copied.emit(text);
    this.clearCopyTimer();
    const duration = resolveCopyFeedbackDurationMs(this.feedbackDurationMs());
    if (duration > 0) {
      this.copyTimer = setTimeout(() => {
        this.copyTimer = null;
        this.copiedState.set(false);
      }, duration);
    }
  }

  private clearCopyTimer(): void {
    if (this.copyTimer !== null) {
      clearTimeout(this.copyTimer);
      this.copyTimer = null;
    }
  }
}
