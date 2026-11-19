import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroChevronDown,
  heroChevronUp,
  heroEye,
  heroEyeSlash,
  heroLockClosed,
  heroLockOpen,
  heroTrash,
} from '@ng-icons/heroicons/outline';
import type {
  AnnotationLayerRecord,
  AnnotationListIntent,
  AnnotationListItem,
  AnnotationListViewModel,
  EmrAnnotationListLabels,
} from '@drguptavivek/emr-controller';
import {
  ANNOTATION_LIST_NAV_KEYS,
  ANNOTATION_LIST_TOOL_GLYPH,
  ANNOTATION_LIST_TOOL_NAME,
  annotationFullSummary,
  annotationPrimaryLabel,
  annotationSecondaryLabel,
  canMoveAnnotationLayer,
  canRemoveAnnotationLayer,
  canToggleAnnotationLayerLock,
  canToggleAnnotationLayerVisibility,
  resolveAnnotationListActiveId,
  resolveAnnotationListId,
  resolveAnnotationListLabels,
  resolveAnnotationListRowId,
} from './emr-annotation-list.logic';

@Component({
  selector: 'emr-annotation-list',
  standalone: true,
  imports: [NgIcon],
  providers: [
    ...provideIcons({
      heroChevronDown,
      heroChevronUp,
      heroEye,
      heroEyeSlash,
      heroLockClosed,
      heroLockOpen,
      heroTrash,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(focusin)': 'onHostFocusIn()',
    '(focusout)': 'onHostFocusOut($event)',
  },
  template: `
    @if (model().items.length) {
      <ol
        class="al"
        [id]="listId()"
        [attr.aria-label]="headingId() ? null : resolvedLabels().listAria"
        [attr.aria-labelledby]="headingId() ?? null"
        (keydown)="onKey($event)"
        (focusin)="onListFocus($event)"
      >
        @for (it of model().items; track it.layer.id; let first = $first; let last = $last) {
          @let selected = it.layer.id === model().selectedLayerId;
          <li
            class="al__row"
            [id]="rowId(it.layer.id)"
            [class.al__row--on]="selected"
            [class.al__row--off]="!it.layer.visible"
            [attr.aria-current]="selected ? 'true' : null"
            [attr.data-id]="it.layer.id"
          >
            <button
              #sel
              type="button"
              class="al__main"
              [attr.data-id]="it.layer.id"
              [attr.tabindex]="tab(it.layer.id)"
              [attr.title]="full(it)"
              (click)="selectLayer(it.layer.id)"
            >
              <span class="al__no" aria-hidden="true">{{ it.number }}</span>
              <span class="al__sw" aria-hidden="true" [style.background]="it.layer.color"></span>
              <span class="al__txt">
                <span class="al__name">
                  {{ primary(it) }}@if (secondary(it); as extra) { <span class="al__cls"> · {{ extra }}</span> }
                </span>
                @if (it.description) {
                  <span class="al__desc">{{ it.description }}</span>
                }
              </span>
              <span class="al__tool" role="img" [attr.aria-label]="toolName(it.layer)" [attr.title]="toolName(it.layer)">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                  @switch (glyph(it.layer)) {
                    @case ('shape-line') { <path d="M5 19 19 5" /> }
                    @case ('shape-arrow') { <path d="M5 19 19 5M11 5h8v8" /> }
                    @case ('shape-callout') { <path d="M19 5 9 15M9 15h5M9 15v-5M3 21h7" /> }
                    @case ('shape-curve') { <path d="M6 19C6 9 18 15 18 5" /> }
                    @case ('shape-ellipse') { <ellipse cx="12" cy="12" rx="8" ry="6" /> }
                    @case ('shape-polygon') { <path d="m12 4 8 6-3 10H7L4 10z" /> }
                    @case ('shape-freehand') { <path d="M4 14c2-6 4-6 5-2s3 4 5-1 4-3 6 1" /> }
                    @case ('shape-text') { <path d="M6 6h12M12 6v13M9.5 19h5" /> }
                  }
                </svg>
              </span>
              @if (it.locked) {
                <ng-icon
                  class="al__tool"
                  name="heroLockClosed"
                  role="img"
                  [attr.aria-label]="resolvedLabels().locked"
                  [attr.title]="resolvedLabels().locked"
                />
              }
              @if (model().readOnly && !it.layer.visible) {
                <ng-icon
                  class="al__tool"
                  name="heroEyeSlash"
                  role="img"
                  [attr.aria-label]="resolvedLabels().hidden"
                  [attr.title]="resolvedLabels().hidden"
                />
              }
              <span class="emr-sr-only">
                {{ resolvedLabels().drawingPrefix }} {{ it.number }}@if (it.locked) {, {{ resolvedLabels().locked }}}@if (!it.layer.visible) {, {{ resolvedLabels().hidden }}}
              </span>
            </button>
            @if (!model().readOnly) {
              <span class="al__acts" data-emr-print="hide">
                <button
                  type="button"
                  class="al__b al__b--eye"
                  [attr.tabindex]="tab(it.layer.id)"
                  [attr.aria-pressed]="it.layer.visible ? 'true' : 'false'"
                  [attr.aria-label]="resolvedLabels().showDrawing(it.number, primary(it))"
                  [attr.title]="it.layer.visible ? resolvedLabels().hideTitle : resolvedLabels().showTitle"
                  (click)="toggleVisibility(it.layer.id)"
                >
                  <span class="al__f">
                    <ng-icon [name]="it.layer.visible ? 'heroEye' : 'heroEyeSlash'" aria-hidden="true" />
                  </span>
                </button>
                @if (model().canLock) {
                  <button
                    type="button"
                    class="al__b"
                    [attr.tabindex]="tab(it.layer.id)"
                    [attr.aria-pressed]="it.locked ? 'true' : 'false'"
                    [attr.aria-label]="resolvedLabels().lockDrawing(it.number, primary(it))"
                    [attr.title]="it.locked ? resolvedLabels().unlockTitle : resolvedLabels().lockTitle"
                    (click)="toggleLock(it.layer.id)"
                  >
                    <span class="al__f">
                      <ng-icon [name]="it.locked ? 'heroLockClosed' : 'heroLockOpen'" aria-hidden="true" />
                    </span>
                  </button>
                }
                @if (selected) {
                  <button
                    type="button"
                    class="al__b"
                    [attr.tabindex]="tab(it.layer.id)"
                    [attr.aria-disabled]="first || it.locked ? 'true' : null"
                    [attr.aria-label]="resolvedLabels().moveUpDrawing(it.number, primary(it))"
                    [attr.title]="resolvedLabels().moveUpTitle"
                    (click)="moveLayer(it.layer.id, 'up')"
                  >
                    <span class="al__f"><ng-icon name="heroChevronUp" aria-hidden="true" /></span>
                  </button>
                  <button
                    type="button"
                    class="al__b"
                    [attr.tabindex]="tab(it.layer.id)"
                    [attr.aria-disabled]="last || it.locked ? 'true' : null"
                    [attr.aria-label]="resolvedLabels().moveDownDrawing(it.number, primary(it))"
                    [attr.title]="resolvedLabels().moveDownTitle"
                    (click)="moveLayer(it.layer.id, 'down')"
                  >
                    <span class="al__f"><ng-icon name="heroChevronDown" aria-hidden="true" /></span>
                  </button>
                }
                <button
                  type="button"
                  class="al__b al__b--danger"
                  [attr.tabindex]="tab(it.layer.id)"
                  [attr.aria-disabled]="it.locked ? 'true' : null"
                  [attr.aria-label]="resolvedLabels().deleteDrawing(it.number, primary(it))"
                  [attr.title]="resolvedLabels().deleteTitle"
                  (click)="removeLayer(it.layer.id)"
                >
                  <span class="al__f"><ng-icon name="heroTrash" aria-hidden="true" /></span>
                </button>
              </span>
            }
          </li>
        }
      </ol>
    } @else {
      <p class="emr-empty al__empty" role="status">{{ model().emptyMessage }}</p>
    }
  `,
  styles: [`
    :host{display:block;color:var(--emr-text);font-family:var(--emr-font-family);font-variant-numeric:tabular-nums}
    .al{list-style:none;margin:0;padding:0;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface);overflow:hidden}
    .al__row{display:flex;flex-wrap:wrap;align-items:center;border-bottom:1px solid var(--emr-border);break-inside:avoid;page-break-inside:avoid}
    .al__row:last-child{border-bottom:0}
    .al__row--on{background:var(--emr-primary-soft);box-shadow:inset 4px 0 0 var(--emr-primary)}
    .al__main{flex:1 1 150px;min-width:0;min-height:max(44px,var(--emr-control-height));display:flex;align-items:center;gap:8px;padding:2px 8px 2px 12px;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;--ng-icon__size:16px}
    .al__no{flex:none;min-width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--emr-border);border-radius:6px;background:var(--emr-surface);font-family:var(--emr-font-mono);font-size:var(--emr-text-xs);font-weight:var(--emr-weight-bold);font-variant-numeric:tabular-nums}
    .al__sw{flex:none;width:14px;height:14px;border-radius:50%;border:2px solid var(--emr-text-muted)}
    .al__txt{flex:1;min-width:0;display:grid;grid-template-columns:minmax(0,1fr)}
    .al__name{font-size:var(--emr-text-md);font-weight:var(--emr-weight-medium);line-height:var(--emr-leading-tight);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .al__cls{font-weight:var(--emr-weight-regular)}
    .al__desc{font-size:var(--emr-text-xs);color:var(--emr-text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .al__tool{flex:none;display:inline-flex;color:var(--emr-text-muted)}
    .al__tool svg{fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
    .al__row--on .al__name{font-weight:var(--emr-weight-bold)}
    .al__row--off .al__name{font-style:italic}
    .al__row--off .al__sw{border-style:dashed}
    .al__acts{display:flex;margin-left:auto;padding-right:4px}
    .al__b{width:44px;min-width:44px;min-height:44px;height:max(44px,var(--emr-control-height));padding:0;border:0;background:transparent;color:inherit;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
    .al__f{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border:1px solid transparent;border-radius:8px;--ng-icon__size:18px}
    .al__b:hover:not([aria-disabled="true"]) .al__f{background:var(--emr-surface-soft);border-color:var(--emr-border)}
    .al__b--danger{color:var(--emr-danger)}
    .al__b--danger:hover:not([aria-disabled="true"]) .al__f{background:var(--emr-danger-soft);border-color:var(--emr-danger)}
    .al__b[aria-pressed="true"]:not(.al__b--eye) .al__f{background:var(--emr-primary-soft);border-color:var(--emr-primary-border)}
    .al__b[aria-disabled="true"]{cursor:not-allowed;opacity:.52}
    .al__main:focus-visible,.al__b:focus-visible{outline:3px solid color-mix(in srgb,var(--emr-focus) 70%,transparent);outline-offset:-3px;border-radius:8px}
    .al__empty{margin:0;min-height:0;padding:16px;border:1px dashed var(--emr-border);border-radius:8px;font-size:var(--emr-text-md)}
    :host-context(.emr-print) .al__acts{display:none !important}
    :host-context(.emr-print) .al__name,:host-context(.emr-print) .al__desc{white-space:normal;overflow:visible;text-overflow:clip}
    :host-context(.emr-print) .al__row--on{box-shadow:none;background:transparent}
    @media print{.al__acts{display:none !important}.al__name,.al__desc{white-space:normal;overflow:visible;text-overflow:clip}.al__row--on{box-shadow:none;background:transparent}}
  `],
})
export class EmrAnnotationListComponent {
  readonly model = input.required<AnnotationListViewModel>();
  readonly headingId = input<string>();
  readonly idPrefix = input<string>('');
  readonly labels = input<EmrAnnotationListLabels>();

  readonly intent = output<AnnotationListIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly selects = viewChildren<ElementRef<HTMLButtonElement>>('sel');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Roving stop: only this row's buttons are in the Tab order, so 50 rows are not 300 tab stops. */
  private readonly activeId = signal<string | null>(null);
  private isFocusWithin = false;

  protected readonly resolvedLabels = computed(() => resolveAnnotationListLabels(this.labels()));
  protected readonly listId = computed(() => resolveAnnotationListId(this.idPrefix(), this.headingId()));
  protected readonly activeStop = computed(() =>
    resolveAnnotationListActiveId(this.model(), this.activeId()),
  );

  rowId(layerId: string): string {
    return resolveAnnotationListRowId(this.idPrefix(), layerId);
  }

  glyph(l: AnnotationLayerRecord): string {
    return ANNOTATION_LIST_TOOL_GLYPH[l.tool];
  }

  toolName(l: AnnotationLayerRecord): string {
    return ANNOTATION_LIST_TOOL_NAME[l.tool];
  }

  primary(it: AnnotationListItem): string {
    return annotationPrimaryLabel(it);
  }

  secondary(it: AnnotationListItem): string {
    return annotationSecondaryLabel(it);
  }

  full(it: AnnotationListItem): string {
    return annotationFullSummary(it);
  }

  tab(id: string): number {
    return id === this.activeStop() ? 0 : -1;
  }

  protected selectLayer(layerId: string): void {
    if (this.model().items.some((item) => item.layer.id === layerId)) {
      this.intent.emit({ type: 'layerSelected', layerId });
    }
  }

  protected toggleVisibility(layerId: string): void {
    if (canToggleAnnotationLayerVisibility(this.model(), layerId)) {
      this.intent.emit({ type: 'layerVisibilityToggleRequested', layerId });
    }
  }

  protected toggleLock(layerId: string): void {
    if (canToggleAnnotationLayerLock(this.model(), layerId)) {
      this.intent.emit({ type: 'layerLockToggleRequested', layerId });
    }
  }

  protected moveLayer(layerId: string, direction: 'up' | 'down'): void {
    if (canMoveAnnotationLayer(this.model(), layerId, direction)) {
      this.intent.emit({ type: 'layerMoveRequested', layerId, direction });
    }
  }

  protected removeLayer(layerId: string): void {
    if (canRemoveAnnotationLayer(this.model(), layerId)) {
      this.intent.emit({ type: 'layerRemoveRequested', layerId });
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

  protected onListFocus(e: FocusEvent): void {
    const id = (e.target as HTMLElement | null)?.closest('li')?.dataset?.['id'];
    if (id) this.activeId.set(id);
  }

  protected onKey(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    if (!ANNOTATION_LIST_NAV_KEYS.includes(e.key) || !target.classList.contains('al__main')) return;
    const els = this.selects().map((r) => r.nativeElement);
    if (els.length === 0) return;
    const i = els.indexOf(target as HTMLButtonElement);
    if (i < 0) return;
    const next =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? els.length - 1
          : Math.min(els.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)));
    e.preventDefault();
    const id = els[next].dataset['id'];
    if (id) this.activeId.set(id);
    els[next].focus();
  }
}
