import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { heroCheck, heroMagnifyingGlass, heroStar, heroXMark } from '@ng-icons/heroicons/outline';
import { heroStarSolid } from '@ng-icons/heroicons/solid';
import type {
  EmrImageTemplatePickerLabels,
  ImageTemplateOption,
  ImageTemplatePickerIntent,
  ImageTemplatePickerViewModel,
} from '@drguptavivek/emr-controller';
import {
  FAVOURITES_GROUP_ID,
  canEditTemplateFavourites,
  canSelectImageTemplate,
  canToggleTemplateFavourite,
  isTemplateFavourite,
  partitionImageTemplates,
  resolveImageTemplatePickerHeadingId,
  resolveImageTemplatePickerId,
  resolveImageTemplatePickerLabels,
  resolveImageTemplateSearchId,
  resolveImageTemplateSectionId,
  resolvePickerTabStopId,
  showFavouritePinHint,
  showFavouritesFilterChip,
  templateGridNextIndex,
  templateTileLabel,
} from './emr-image-template-picker.logic';

let nextPickerId = 0;

@Component({
  selector: 'emr-image-template-picker',
  standalone: true,
  imports: [NgIcon, NgTemplateOutlet],
  providers: [provideIcons({ heroCheck, heroMagnifyingGlass, heroStar, heroStarSolid, heroXMark })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(focusin)': 'onHostFocusIn()',
    '(focusout)': 'onHostFocusOut($event)',
  },
  template: `
    <section
      class="tp"
      data-emr-print="hide"
      [id]="pickerId()"
      [attr.aria-labelledby]="titleId()"
      (keydown.escape)="onEscape($event)"
      (focusin)="onPickerFocusIn($event)"
    >
      <header class="tp__head">
        <div class="tp__title">
          <h3 class="tp__name" [id]="titleId()">{{ model().title }}</h3>
          @if (model().totalLabel) {
            <p class="tp__total" role="status">{{ model().totalLabel }}</p>
          }
        </div>
        <button
          type="button"
          class="emr-icon-button tp__close"
          [attr.aria-label]="resolvedLabels().close"
          [attr.title]="resolvedLabels().close"
          (click)="emitClose()"
        >
          <ng-icon name="heroXMark" aria-hidden="true" />
        </button>
      </header>

      <div class="tp__search">
        <label class="emr-sr-only" [for]="searchId()">{{ resolvedLabels().searchAria(model().title) }}</label>
        <ng-icon class="tp__glass" name="heroMagnifyingGlass" aria-hidden="true" />
        <input
          class="emr-search-input tp__input"
          [class.tp__input--clearable]="!!model().query"
          type="search"
          autocomplete="off"
          [placeholder]="resolvedLabels().searchPlaceholder"
          [id]="searchId()"
          [value]="model().query"
          (input)="onQuery($event)"
        />
        @if (model().query) {
          <button
            type="button"
            class="tp__clear"
            [attr.aria-label]="resolvedLabels().clearSearch"
            [attr.title]="resolvedLabels().clearSearch"
            (click)="clearSearch()"
          >
            <ng-icon name="heroXMark" aria-hidden="true" />
          </button>
        }
      </div>

      <div class="tp__chips" role="group" [attr.aria-label]="resolvedLabels().filterAria(model().title)">
        @if (showFavouritesChip()) {
          <button
            type="button"
            class="tp__chip"
            [attr.aria-pressed]="model().selectedGroupId === favouritesId"
            (click)="selectGroup(favouritesId)"
          >
            <ng-icon name="heroStarSolid" class="tp__chip-star" aria-hidden="true" />
            <span>{{ resolvedLabels().favourites }}</span>
            <span class="tp__n">{{ model().favouriteIds?.length ?? 0 }}</span>
          </button>
        }
        <button
          type="button"
          class="tp__chip"
          [attr.aria-pressed]="!model().selectedGroupId"
          (click)="selectGroup(null)"
        >
          {{ resolvedLabels().all }}
        </button>
        @for (g of model().groups; track g.id) {
          <button
            type="button"
            class="tp__chip"
            [attr.aria-pressed]="model().selectedGroupId === g.id"
            (click)="selectGroup(g.id)"
          >
            <span>{{ g.label }}</span>
            @if (g.count !== undefined) {
              <span class="tp__n">{{ g.count }}</span>
            }
          </button>
        }
      </div>

      @if (view().flat.length) {
        @if (view().favs.length) {
          <div class="tp__sec" role="group" [attr.aria-labelledby]="favSectionId()">
            <h4 class="tp__sub" [id]="favSectionId()">
              <ng-icon name="heroStarSolid" class="tp__sub-star" aria-hidden="true" />
              <span>{{ resolvedLabels().favourites }}</span>
              <span class="tp__n">{{ view().favs.length }}</span>
            </h4>
            <ul class="tp__grid" role="list">
              <ng-container [ngTemplateOutlet]="tiles" [ngTemplateOutletContext]="{ $implicit: view().favs }" />
            </ul>
          </div>
        } @else if (showHint()) {
          <p class="tp__hint">{{ resolvedLabels().starHint }}</p>
        }
        @if (view().rest.length) {
          <div
            class="tp__sec"
            [attr.role]="view().favs.length ? 'group' : null"
            [attr.aria-labelledby]="view().favs.length ? allSectionId() : null"
          >
            @if (view().favs.length) {
              <h4 class="tp__sub" [id]="allSectionId()">
                <span>{{ resolvedLabels().allTemplates }}</span>
                <span class="tp__n">{{ view().rest.length }}</span>
              </h4>
            }
            <ul class="tp__grid" role="list">
              <ng-container [ngTemplateOutlet]="tiles" [ngTemplateOutletContext]="{ $implicit: view().rest }" />
            </ul>
          </div>
        }
      } @else {
        <div class="emr-empty tp__empty" role="status">
          <p class="tp__empty-msg">{{ model().emptyMessage }}</p>
          <div class="tp__empty-actions">
            @if (model().query) {
              <button
                type="button"
                class="emr-button emr-button--outline emr-button--small tp__empty-btn"
                (click)="clearSearch()"
              >
                {{ resolvedLabels().clearSearch }}
              </button>
            }
            @if (model().selectedGroupId) {
              <button
                type="button"
                class="emr-button emr-button--outline emr-button--small tp__empty-btn"
                (click)="selectGroup(null)"
              >
                {{ resolvedLabels().showAll }}
              </button>
            }
            @if (model().query && model().selectedGroupId) {
              <button
                type="button"
                class="emr-button emr-button--outline emr-button--small tp__empty-btn"
                (click)="resetFilters()"
              >
                {{ resolvedLabels().resetFilters }}
              </button>
            }
          </div>
        </div>
      }

      <ng-template #tiles let-list>
        @for (o of list; track o.id) {
          <li class="tp__item" [class.tp__item--sel]="o.id === model().selectedId">
            <button
              #tile
              type="button"
              class="tp__tile"
              [attr.data-id]="o.id"
              [attr.tabindex]="o.id === tabStopId() ? 0 : -1"
              [attr.aria-pressed]="o.id === model().selectedId"
              [attr.aria-disabled]="effectiveReadOnly() ? 'true' : null"
              [attr.aria-label]="tileName(o)"
              (click)="select(o)"
              (keydown)="onKey($event, o.id)"
            >
              <span class="tp__frame">
                <img [src]="o.imageUrl" [alt]="o.altText ?? o.label" loading="lazy" decoding="async" />
              </span>
              <span class="tp__label" [attr.title]="o.label">{{ o.label }}</span>
              @if (o.badges?.length) {
                <span class="tp__badges">
                  @for (b of o.badges; track b) {
                    <span class="tp__badge">{{ b }}</span>
                  }
                </span>
              }
            </button>
            @if (o.id === model().selectedId) {
              <span class="tp__check" aria-hidden="true"><ng-icon name="heroCheck" /></span>
            }
            @if (canEditFavs()) {
              <button
                #star
                type="button"
                class="tp__star"
                [attr.data-star]="o.id"
                [attr.tabindex]="o.id === tabStopId() ? 0 : -1"
                [attr.aria-pressed]="isFavourite(o.id)"
                [attr.aria-label]="isFavourite(o.id) ? resolvedLabels().removeFavourite(o.label) : resolvedLabels().addFavourite(o.label)"
                (click)="toggleFavourite(o)"
              >
                <span class="tp__star-bg">
                  <ng-icon [name]="isFavourite(o.id) ? 'heroStarSolid' : 'heroStar'" aria-hidden="true" />
                </span>
              </button>
            }
          </li>
        }
      </ng-template>
    </section>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text);min-width:0}
    .tp{display:grid;gap:12px;border:1px solid var(--emr-border);border-radius:12px;background:var(--emr-surface);padding:16px;min-width:0}
    .tp__head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
    .tp__title{min-width:0}
    .tp__name{margin:0;font-size:var(--emr-text-xl);line-height:var(--emr-leading-tight);overflow-wrap:anywhere}
    .tp__total{margin:2px 0 0;font-size:var(--emr-text-sm);color:var(--emr-text-muted)}
    .tp__close{width:44px;min-width:44px;min-height:44px;height:max(44px,var(--emr-control-height))}
    .tp__search{position:relative}
    .tp__glass{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--emr-text-muted);pointer-events:none;font-size:1.125rem}
    .tp__input{min-height:max(44px,var(--emr-control-height));padding-left:38px}
    .tp__input--clearable{padding-right:46px}
    .tp__input::-webkit-search-cancel-button{-webkit-appearance:none;appearance:none}
    .tp__clear{position:absolute;right:2px;top:50%;transform:translateY(-50%);display:grid;place-items:center;width:44px;min-width:44px;height:44px;min-height:44px;padding:0;border:0;border-radius:6px;background:transparent;color:var(--emr-text-muted);cursor:pointer;font-size:1rem}
    .tp__clear:hover{color:var(--emr-text);background:var(--emr-surface-soft)}
    .tp__clear:focus-visible{outline:3px solid var(--emr-focus);outline-offset:-2px}
    .tp__chips{display:flex;flex-wrap:wrap;gap:6px;padding:3px;margin:-3px;max-height:calc(3 * max(44px,var(--emr-control-height)) + 18px);overflow-y:auto}
    .tp__chip{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-width:44px;min-height:max(44px,var(--emr-control-height));padding:0 12px;border:1px solid var(--emr-border);border-radius:999px;background:var(--emr-surface);color:var(--emr-text);font:inherit;font-size:var(--emr-text-sm);font-weight:var(--emr-weight-medium);cursor:pointer;white-space:nowrap}
    .tp__chip:hover{background:var(--emr-surface-raised)}
    .tp__chip[aria-pressed="true"]{background:var(--emr-primary-soft);border-color:var(--emr-primary);box-shadow:inset 0 0 0 1px var(--emr-primary);color:var(--emr-primary-contrast);font-weight:var(--emr-weight-bold)}
    .tp__chip-star,.tp__sub-star{color:var(--emr-warning)}
    .tp__n{color:var(--emr-text-muted);font-weight:var(--emr-weight-regular)}
    .tp__chip[aria-pressed="true"] .tp__n{color:inherit}
    .tp__sec{display:grid;gap:8px}
    .tp__sub{margin:0;display:flex;align-items:center;gap:6px;font-size:var(--emr-text-sm);font-weight:var(--emr-weight-bold);text-transform:uppercase;letter-spacing:.06em;color:var(--emr-text-muted)}
    .tp__hint{margin:0;font-size:var(--emr-text-sm);color:var(--emr-text-muted)}
    .tp__grid{list-style:none;margin:0;padding:0;display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(min(120px,100%),1fr))}
    .tp__item{position:relative;min-width:0;display:grid}
    .tp__tile{display:grid;grid-template-rows:auto auto 1fr;align-content:start;gap:4px;width:100%;min-height:max(44px,var(--emr-control-height));padding:6px;text-align:left;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface);color:var(--emr-text);font:inherit;cursor:pointer}
    .tp__tile:hover{background:var(--emr-surface-raised)}
    .tp__tile[aria-disabled="true"]{cursor:default}
    .tp__tile[aria-disabled="true"]:hover{background:var(--emr-surface)}
    .tp__item--sel .tp__tile{border-color:var(--emr-primary);box-shadow:0 0 0 1px var(--emr-primary);background:var(--emr-primary-soft)}
    .tp__frame{display:block;aspect-ratio:1/1;background:var(--emr-surface-soft);border-radius:6px;overflow:hidden}
    .tp__frame img{display:block;width:100%;height:100%;object-fit:contain}
    .tp__label{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden;font-size:var(--emr-text-sm);font-weight:var(--emr-weight-medium);line-height:var(--emr-leading-tight);overflow-wrap:anywhere}
    .tp__badges{display:flex;flex-wrap:wrap;align-content:flex-start;align-items:flex-start;gap:4px}
    .tp__badge{padding:2px 6px;border-radius:999px;background:var(--emr-neutral-soft);color:var(--emr-text);font-size:var(--emr-text-2xs);font-weight:var(--emr-weight-bold);line-height:1}
    .tp__check{position:absolute;top:10px;left:10px;display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:var(--emr-primary-soft);color:var(--emr-primary-contrast);border:2px solid var(--emr-primary);font-size:.875rem;pointer-events:none}
    .tp__star{position:absolute;top:2px;right:2px;display:grid;place-items:center;width:44px;min-width:44px;height:44px;min-height:44px;padding:0;border:0;background:transparent;color:var(--emr-text);cursor:pointer}
    .tp__star-bg{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--emr-surface);border:1px solid var(--emr-border);font-size:1rem}
    .tp__star:hover .tp__star-bg{background:var(--emr-surface-raised)}
    .tp__star[aria-pressed="true"] .tp__star-bg{color:var(--emr-warning);border-color:var(--emr-warning);background:var(--emr-warning-soft)}
    .tp__tile:focus-visible,.tp__star:focus-visible,.tp__chip:focus-visible,.tp__close:focus-visible{outline:3px solid var(--emr-focus);outline-offset:2px}
    .tp__empty{gap:8px;min-height:120px}
    .tp__empty-msg{margin:0}
    .tp__empty-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
    .tp__empty-btn{min-height:max(44px,var(--emr-control-height));min-width:44px}
    @media(max-width:480px){.tp{padding:12px}}
    :host-context(.emr-print){display:none !important}
    :host-context(.emr-print) .tp{display:none !important}
    @media print{:host,.tp{display:none !important}.tp__chips{max-height:none;overflow:visible}}
  `],
})
export class EmrImageTemplatePickerComponent implements AfterViewChecked {
  readonly model = input.required<ImageTemplatePickerViewModel>();
  readonly headingId = input<string>();
  readonly idPrefix = input<string>('');
  readonly readOnly = input<boolean>(false);
  readonly labels = input<EmrImageTemplatePickerLabels>();

  readonly intent = output<ImageTemplatePickerIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly tileRefs = viewChildren<ElementRef<HTMLButtonElement>>('tile');
  private readonly starRefs = viewChildren<ElementRef<HTMLButtonElement>>('star');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly uid = `emr-tpl-${++nextPickerId}`;
  protected readonly favouritesId = FAVOURITES_GROUP_ID;

  /** Roving tab stop (focus bookkeeping only). */
  private readonly activeId = signal<string | null>(null);
  private isFocusWithin = false;
  /** After starring, the tile jumps sections and is re-created: restore focus to its star once the model changes. */
  private refocusStarId?: string;
  private refocusReady = false;

  protected readonly resolvedLabels = computed(() => resolveImageTemplatePickerLabels(this.labels()));
  protected readonly effectiveReadOnly = computed(() => !!(this.readOnly() || this.model().readOnly));
  protected readonly pickerId = computed(() =>
    resolveImageTemplatePickerId(this.idPrefix(), this.headingId(), this.uid),
  );
  protected readonly titleId = computed(() =>
    resolveImageTemplatePickerHeadingId(this.idPrefix(), this.headingId(), `${this.uid}-heading`),
  );
  protected readonly searchId = computed(() =>
    resolveImageTemplateSearchId(this.idPrefix(), this.headingId(), this.uid),
  );
  protected readonly favSectionId = computed(() =>
    resolveImageTemplateSectionId('fav', this.idPrefix(), this.headingId(), this.uid),
  );
  protected readonly allSectionId = computed(() =>
    resolveImageTemplateSectionId('all', this.idPrefix(), this.headingId(), this.uid),
  );
  protected readonly view = computed(() => partitionImageTemplates(this.model()));
  protected readonly tabStopId = computed(() =>
    resolvePickerTabStopId(this.view().flat, this.model().selectedId, this.activeId()),
  );
  protected readonly canEditFavs = computed(() =>
    canEditTemplateFavourites(this.model(), this.readOnly()),
  );
  protected readonly showFavouritesChip = computed(() =>
    showFavouritesFilterChip(this.model(), this.readOnly()),
  );
  protected readonly showHint = computed(() =>
    showFavouritePinHint(this.model(), this.readOnly()),
  );

  constructor() {
    effect(() => {
      this.model();
      if (this.refocusStarId) this.refocusReady = true;
    });
  }

  ngAfterViewChecked(): void {
    if (!this.refocusStarId || !this.refocusReady) return;
    const id = this.refocusStarId;
    this.refocusStarId = undefined;
    this.refocusReady = false;
    this.starEl(id)?.focus();
  }

  protected isFavourite(id: string): boolean {
    return isTemplateFavourite(this.model(), id);
  }

  protected tileName(o: ImageTemplateOption): string {
    return templateTileLabel(o);
  }

  protected emitClose(): void {
    this.intent.emit({ type: 'closeRequested' });
  }

  protected onEscape(event: Event): void {
    event.preventDefault();
    if (this.model().query) {
      this.clearSearch();
    } else {
      this.emitClose();
    }
  }

  protected onQuery(event: Event): void {
    this.intent.emit({
      type: 'queryChangeRequested',
      query: (event.target as HTMLInputElement).value,
    });
  }

  protected clearSearch(): void {
    this.intent.emit({ type: 'queryChangeRequested', query: '' });
  }

  protected selectGroup(groupId: string | null): void {
    this.intent.emit({ type: 'groupSelected', groupId });
  }

  protected resetFilters(): void {
    if (this.model().query) {
      this.intent.emit({ type: 'queryChangeRequested', query: '' });
    }
    if (this.model().selectedGroupId) {
      this.intent.emit({ type: 'groupSelected', groupId: null });
    }
  }

  protected select(o: ImageTemplateOption): void {
    if (canSelectImageTemplate(this.effectiveReadOnly(), o)) {
      this.intent.emit({ type: 'templateSelected', templateId: o.id });
    }
  }

  protected toggleFavourite(o: ImageTemplateOption): void {
    if (!canToggleTemplateFavourite(this.model(), o, this.readOnly())) return;
    this.refocusStarId = o.id;
    this.refocusReady = false;
    this.intent.emit({
      type: 'favouriteToggleRequested',
      templateId: o.id,
      favourite: !this.isFavourite(o.id),
    });
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

  protected onPickerFocusIn(event: FocusEvent): void {
    const el = event.target as HTMLElement;
    if (el.dataset['id']) this.activeId.set(el.dataset['id']);
    else if (el.dataset['star']) this.activeId.set(el.dataset['star']);
    // Focus moving anywhere else cancels a pending star refocus.
    if (this.refocusStarId && el.dataset['star'] !== this.refocusStarId) {
      this.refocusStarId = undefined;
    }
  }

  private tileEl(id: string): HTMLButtonElement | undefined {
    return this.tileRefs().find((r) => r.nativeElement.dataset['id'] === id)?.nativeElement;
  }

  private starEl(id: string): HTMLButtonElement | undefined {
    return this.starRefs().find((r) => r.nativeElement.dataset['star'] === id)?.nativeElement;
  }

  /** Columns in the row of the focused tile's own grid, measured from layout so it tracks the auto-fill width. */
  private columns(from: HTMLElement): number {
    const tiles = [...(from.closest('ul')?.querySelectorAll<HTMLElement>('.tp__item') ?? [])];
    const top = tiles[0]?.offsetTop;
    return Math.max(1, tiles.filter((t) => t.offsetTop === top).length);
  }

  protected onKey(event: KeyboardEvent, id: string): void {
    const { favs, flat } = this.view();
    const i = flat.findIndex((o) => o.id === id);
    if (i < 0) return;
    const cols = this.columns(event.currentTarget as HTMLElement);
    const nextIdx = templateGridNextIndex(event.key, i, flat.length, favs.length, cols);
    if (nextIdx === null) return;
    event.preventDefault();
    const nextId = flat[nextIdx]?.id;
    if (nextId) {
      this.activeId.set(nextId);
      this.tileEl(nextId)?.focus();
    }
  }
}
