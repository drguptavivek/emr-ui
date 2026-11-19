import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  heroArrowDownTray,
  heroArrowLongRight,
  heroArrowsPointingIn,
  heroArrowsPointingOut,
  heroArrowTrendingUp,
  heroArrowUturnLeft,
  heroArrowUturnRight,
  heroBackspace,
  heroBars3BottomLeft,
  heroCheck,
  heroCircleStack,
  heroCursorArrowRays,
  heroHandRaised,
  heroMagnifyingGlassMinus,
  heroMagnifyingGlassPlus,
  heroMinus,
  heroPencil,
  heroPencilSquare,
  heroSquare2Stack,
  heroStop,
  heroViewfinderCircle,
} from '@ng-icons/heroicons/outline';
import type {
  AnnotationToolbarIntent,
  AnnotationToolbarViewModel,
  EmrAnnotationToolbarLabels,
  ToolbarTool,
} from '@drguptavivek/emr-controller';
import {
  ANNOTATION_TOOLBAR_GLYPHS,
  ANNOTATION_TOOLBAR_KNOWN_ICONS,
  ANNOTATION_TOOLBAR_NAV_KEYS,
  canTriggerToolbarIntent,
  hasAnnotationToolbarPen,
  resolveAnnotationToolbarLabels,
  resolveAnnotationToolbarPanelId,
  resolveToolbarActiveStop,
  resolveToolbarEnabledKeys,
  resolveToolbarPenLabel,
  resolveToolbarToolTitle,
} from './emr-annotation-toolbar.logic';

@Component({
  selector: 'emr-annotation-toolbar',
  standalone: true,
  imports: [NgIcon],
  providers: [
    ...provideIcons({
      heroArrowLongRight,
      heroArrowsPointingIn,
      heroArrowsPointingOut,
      heroViewfinderCircle,
      heroArrowTrendingUp,
      heroArrowUturnLeft,
      heroArrowUturnRight,
      heroArrowDownTray,
      heroBackspace,
      heroBars3BottomLeft,
      heroCheck,
      heroCircleStack,
      heroCursorArrowRays,
      heroHandRaised,
      heroMagnifyingGlassMinus,
      heroMagnifyingGlassPlus,
      heroMinus,
      heroPencil,
      heroPencilSquare,
      heroSquare2Stack,
      heroStop,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(focusin)': 'onHostFocusIn()',
    '(focusout)': 'onHostFocusOut($event)',
    '(document:pointerdown)': 'onDocumentPointerDown($event)',
  },
  template: `
    <div class="tbw" data-emr-print="hide" (keydown.escape)="closePen(true)" (focusout)="onPenFocusOut($event)">
      <div
        class="tb"
        role="toolbar"
        aria-orientation="horizontal"
        [attr.aria-label]="headingId() ? null : resolvedLabels().toolbarAria"
        [attr.aria-labelledby]="headingId() ?? null"
        (keydown)="onKey($event)"
        (focusin)="onToolbarFocus($event)"
      >
        @if (model().tools.length) {
          <div class="tb__g" role="group" [attr.aria-label]="resolvedLabels().toolsGroup">
            @for (t of model().tools; track t.id) {
              @let toolDisabled = locked() || !!t.disabled;
              <button
                #b
                type="button"
                class="tb__b"
                [attr.data-key]="'t:' + t.id"
                [attr.tabindex]="tab('t:' + t.id)"
                [attr.aria-label]="t.label"
                [attr.title]="toolTitle(t)"
                [attr.aria-pressed]="t.id === model().selectedToolId ? 'true' : 'false'"
                [attr.aria-disabled]="toolDisabled ? 'true' : null"
                (click)="emitIntent({ type: 'toolSelected', toolId: t.id })"
              >
                <span class="tb__f">
                  @if (glyph(t.icon)) {
                    <svg class="tb__svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                      @switch (t.icon) {
                        @case ('shape-line') { <path d="M5 19 19 5" /> }
                        @case ('shape-arrow') { <path d="M5 19 19 5M11 5h8v8" /> }
                        @case ('shape-curve') { <path d="M6 19C6 9 18 15 18 5" /> }
                        @case ('shape-rect') { <rect x="5" y="6" width="14" height="12" rx="1" /> }
                        @case ('shape-ellipse') { <ellipse cx="12" cy="12" rx="8" ry="6" /> }
                        @case ('shape-polygon') { <path d="m12 4 8 6-3 10H7L4 10z" /> }
                        @case ('shape-freehand') { <path d="M4 14c2-6 4-6 5-2s3 4 5-1 4-3 6 1" /> }
                        @case ('shape-text') { <path d="M6 6h12M12 6v13M9.5 19h5" /> }
                        @case ('shape-eraser') { <path d="m4 15 9-9 7 7-6 6H8zM9 10l7 7" /> }
                        @case ('shape-callout') { <path d="M19 5 9 15M9 15h5M9 15v-5M3 21h7" /> }
                        @case ('shape-suture') { <path d="M4 12h16M7 9l2 6M11 9l2 6M15 9l2 6" /> }
                        @case ('shape-hatch') { <path d="M5 5h14v14H5zM5 13l8-8M5 19 19 5M11 19l8-8" /> }
                        @case ('shape-lattice') { <path d="M9 4v16M15 4v16M4 9h16M4 15h16" /> }
                      }
                    </svg>
                  } @else if (known(t.icon)) {
                    <ng-icon [name]="t.icon" aria-hidden="true" />
                  } @else {
                    <span class="tb__init" aria-hidden="true">{{ t.label.slice(0, 1) }}</span>
                  }
                </span>
              </button>
            }
          </div>
        }
        @if (hasPen()) {
          <div class="tb__g" role="group" [attr.aria-label]="resolvedLabels().penGroup">
            <button
              #b
              #pen
              type="button"
              class="tb__b tb__b--pen"
              data-key="pen"
              [attr.tabindex]="tab('pen')"
              [attr.aria-label]="penLabel()"
              [attr.title]="penLabel()"
              [attr.aria-expanded]="isPenOpen() ? 'true' : 'false'"
              [attr.aria-controls]="panelId()"
              [attr.aria-disabled]="locked() ? 'true' : null"
              (click)="togglePen()"
            >
              <span class="tb__f tb__f--pen">
                <span class="tb__dot" aria-hidden="true" [style.background]="colour()?.hex"></span>
                <span class="tb__bar" aria-hidden="true" [style.height.px]="width()?.px"></span>
              </span>
            </button>
          </div>
        }
        <div class="tb__g" role="group" [attr.aria-label]="resolvedLabels().historyGroup">
          <button
            #b
            type="button"
            class="tb__b"
            data-key="undo"
            [attr.tabindex]="tab('undo')"
            [attr.aria-label]="resolvedLabels().undo"
            [attr.title]="resolvedLabels().undo"
            [attr.aria-disabled]="locked() || !model().canUndo ? 'true' : null"
            (click)="emitIntent({ type: 'undoRequested' })"
          >
            <span class="tb__f"><ng-icon name="heroArrowUturnLeft" aria-hidden="true" /></span>
          </button>
          <button
            #b
            type="button"
            class="tb__b"
            data-key="redo"
            [attr.tabindex]="tab('redo')"
            [attr.aria-label]="resolvedLabels().redo"
            [attr.title]="resolvedLabels().redo"
            [attr.aria-disabled]="locked() || !model().canRedo ? 'true' : null"
            (click)="emitIntent({ type: 'redoRequested' })"
          >
            <span class="tb__f"><ng-icon name="heroArrowUturnRight" aria-hidden="true" /></span>
          </button>
        </div>
        <div class="tb__g" role="group" [attr.aria-label]="resolvedLabels().zoomGroup">
          <button
            #b
            type="button"
            class="tb__b"
            data-key="zoomOut"
            [attr.tabindex]="tab('zoomOut')"
            [attr.aria-disabled]="model().zoomLocked ? 'true' : null"
            [attr.aria-label]="resolvedLabels().zoomOut"
            [attr.title]="resolvedLabels().zoomOut"
            (click)="emitIntent({ type: 'zoomOutRequested' })"
          >
            <span class="tb__f"><ng-icon name="heroMagnifyingGlassMinus" aria-hidden="true" /></span>
          </button>
          <button
            #b
            type="button"
            class="tb__b"
            data-key="zoomReset"
            [attr.tabindex]="tab('zoomReset')"
            [attr.aria-disabled]="model().zoomLocked ? 'true' : null"
            [attr.aria-label]="resolvedLabels().zoomResetAria(model().zoomLabel)"
            [attr.title]="resolvedLabels().zoomReset"
            (click)="emitIntent({ type: 'zoomResetRequested' })"
          >
            <span class="tb__f tb__f--text">{{ model().zoomLabel }}</span>
          </button>
          <button
            #b
            type="button"
            class="tb__b"
            data-key="zoomIn"
            [attr.tabindex]="tab('zoomIn')"
            [attr.aria-disabled]="model().zoomLocked ? 'true' : null"
            [attr.aria-label]="resolvedLabels().zoomIn"
            [attr.title]="resolvedLabels().zoomIn"
            (click)="emitIntent({ type: 'zoomInRequested' })"
          >
            <span class="tb__f"><ng-icon name="heroMagnifyingGlassPlus" aria-hidden="true" /></span>
          </button>
          <button
            #b
            type="button"
            class="tb__b"
            data-key="zoomFit"
            [attr.tabindex]="tab('zoomFit')"
            [attr.aria-disabled]="model().zoomLocked ? 'true' : null"
            [attr.aria-label]="resolvedLabels().zoomFit"
            [attr.title]="resolvedLabels().zoomFit"
            (click)="emitIntent({ type: 'zoomFitRequested' })"
          >
            <span class="tb__f"><ng-icon name="heroViewfinderCircle" aria-hidden="true" /></span>
          </button>
        </div>
        <div class="tb__g" role="group" [attr.aria-label]="resolvedLabels().saveGroup">
          <button
            #b
            type="button"
            class="tb__b"
            data-key="save"
            [attr.tabindex]="tab('save')"
            [attr.aria-label]="model().saveLabel ?? resolvedLabels().save"
            [attr.title]="model().saveLabel ?? resolvedLabels().save"
            [attr.aria-disabled]="locked() || !model().canSave ? 'true' : null"
            (click)="emitIntent({ type: 'saveRequested' })"
          >
            <span class="tb__f"><ng-icon name="heroArrowDownTray" aria-hidden="true" /></span>
          </button>
        </div>
      </div>
      @if (isPenOpen()) {
        <div
          class="tb__panel"
          role="group"
          [attr.aria-label]="resolvedLabels().penPanelAria"
          tabindex="-1"
          [id]="panelId()"
        >
          @if (model().colours.length) {
            <div class="tb__g" role="group" [attr.aria-label]="resolvedLabels().colourGroup">
              @for (c of model().colours; track c.id) {
                <button
                  type="button"
                  class="tb__b"
                  [attr.title]="c.label"
                  [attr.aria-pressed]="c.id === model().selectedColourId ? 'true' : 'false'"
                  (click)="pick({ type: 'colourSelected', colourId: c.id })"
                >
                  <span class="tb__f tb__f--swatch">
                    <span class="tb__sw" [style.background]="c.hex">
                      @if (c.id === model().selectedColourId) {
                        <ng-icon class="tb__tick" name="heroCheck" aria-hidden="true" />
                      }
                    </span>
                  </span>
                  <span class="emr-sr-only">{{ c.label }}</span>
                </button>
              }
            </div>
          }
          @if (model().widths.length) {
            <div class="tb__g" role="group" [attr.aria-label]="resolvedLabels().widthGroup">
              @for (w of model().widths; track w.id) {
                <button
                  type="button"
                  class="tb__b"
                  [attr.title]="w.label"
                  [attr.aria-pressed]="w.id === model().selectedWidthId ? 'true' : 'false'"
                  (click)="pick({ type: 'widthSelected', widthId: w.id })"
                >
                  <span class="tb__f">
                    <span class="tb__bar tb__bar--wide" aria-hidden="true" [style.height.px]="w.px"></span>
                  </span>
                  <span class="emr-sr-only">{{ w.label }}</span>
                </button>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host{display:block;color:var(--emr-text);font-family:var(--emr-font-family);font-variant-numeric:tabular-nums}
    :host-context(.emr-print){display:none !important}
    .tbw{position:relative}
    .tb{display:flex;flex-wrap:wrap;align-items:center;gap:0 6px;padding:0 2px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface)}
    .tb__g{display:flex;flex-wrap:wrap;align-items:center}
    .tb__b{position:relative;width:44px;height:max(44px,var(--emr-control-height));min-width:44px;min-height:44px;padding:0;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
    .tb__f{display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:34px;padding:0 4px;border:1px solid transparent;border-radius:8px;--ng-icon__size:20px;font-size:var(--emr-text-xs);font-weight:var(--emr-weight-bold);font-family:var(--emr-font-mono);font-variant-numeric:tabular-nums}
    .tb__f--text{padding:0}
    .tb__f--swatch{border-radius:50%}
    .tb__f--pen{flex-direction:column;gap:3px}
    .tb__svg{fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
    .tb__init{font-family:var(--emr-font-family);font-size:var(--emr-text-md);font-weight:var(--emr-weight-bold)}
    .tb__b:hover:not([aria-disabled="true"]) .tb__f{background:var(--emr-surface-soft);border-color:var(--emr-border)}
    .tb__b:focus-visible{outline:3px solid color-mix(in srgb,var(--emr-focus) 70%,transparent);outline-offset:-3px;border-radius:8px}
    .tb__b[aria-disabled="true"]{cursor:not-allowed;opacity:.52}
    .tb__b[aria-pressed="true"] .tb__f,.tb__b[aria-expanded="true"] .tb__f{background:var(--emr-primary-soft);border-color:var(--emr-primary);color:var(--emr-primary-contrast)}
    .tb__b[aria-pressed="true"]::after,.tb__b[aria-expanded="true"]::after{content:"";position:absolute;left:12px;right:12px;bottom:1px;height:3px;border-radius:2px;background:var(--emr-primary)}
    .tb__dot{width:14px;height:14px;border-radius:50%;border:2px solid var(--emr-text-muted);box-sizing:border-box}
    .tb__sw{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;border:2px solid var(--emr-text-muted)}
    .tb__b[aria-pressed="true"] .tb__f--swatch{background:transparent;border-color:var(--emr-primary)}
    .tb__tick{width:14px;height:14px;--ng-icon__size:12px;border-radius:50%;background:var(--emr-surface);color:var(--emr-text);display:inline-flex;align-items:center;justify-content:center}
    .tb__bar{display:block;width:16px;max-height:8px;min-height:1px;border-radius:2px;background:currentColor}
    .tb__bar--wide{width:18px;max-height:10px}
    .tb__panel{position:absolute;z-index:10;top:calc(100% + 4px);left:0;width:max-content;max-width:100%;display:flex;flex-wrap:wrap;gap:0 8px;padding:2px 4px;border:1px solid var(--emr-border);border-radius:8px;background:var(--emr-surface);box-shadow:var(--emr-shadow)}
    @media print{:host{display:none !important}}
  `],
})
export class EmrAnnotationToolbarComponent {
  readonly model = input.required<AnnotationToolbarViewModel>();
  readonly headingId = input<string>();
  readonly idPrefix = input<string>('');
  readonly labels = input<EmrAnnotationToolbarLabels>();

  readonly intent = output<AnnotationToolbarIntent>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('b');
  private readonly penButton = viewChild<ElementRef<HTMLButtonElement>>('pen');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly open = signal(false);
  private readonly focusedKey = signal<string | null>(null);
  private isFocusWithin = false;

  protected readonly resolvedLabels = computed(() => resolveAnnotationToolbarLabels(this.labels()));
  protected readonly panelId = computed(() =>
    resolveAnnotationToolbarPanelId(this.idPrefix(), this.headingId()),
  );
  protected readonly locked = computed(() => !!this.model().readOnly);
  protected readonly hasPen = computed(() => hasAnnotationToolbarPen(this.model()));
  protected readonly isPenOpen = computed(() => this.open() && !this.locked() && this.hasPen());
  protected readonly colour = computed(() =>
    this.model().colours.find((c) => c.id === this.model().selectedColourId),
  );
  protected readonly width = computed(() =>
    this.model().widths.find((w) => w.id === this.model().selectedWidthId),
  );
  protected readonly activeStop = computed(() =>
    resolveToolbarActiveStop(this.model(), this.focusedKey()),
  );
  protected readonly penLabel = computed(() =>
    resolveToolbarPenLabel(this.model(), this.resolvedLabels()),
  );

  constructor() {
    effect(() => {
      if (this.locked() || !this.hasPen()) {
        this.open.set(false);
      }
    });
  }

  protected togglePen(): void {
    if (this.locked() || !this.hasPen()) {
      this.open.set(false);
      return;
    }
    this.open.update((prev) => !prev);
  }

  protected closePen(refocus: boolean): void {
    if (!this.open()) return;
    this.open.set(false);
    if (refocus) this.penButton()?.nativeElement.focus();
  }

  protected emitIntent(i: AnnotationToolbarIntent): void {
    if (!canTriggerToolbarIntent(this.model(), i)) return;
    this.intent.emit(i);
  }

  protected pick(i: AnnotationToolbarIntent): void {
    if (!canTriggerToolbarIntent(this.model(), i)) return;
    this.intent.emit(i);
    this.closePen(true);
  }

  protected onPenFocusOut(e: FocusEvent): void {
    if (this.open() && !this.host.nativeElement.contains(e.relatedTarget as Node | null)) {
      this.open.set(false);
    }
  }

  protected onDocumentPointerDown(e: Event): void {
    if (!this.open()) return;
    const target = e.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.open.set(false);
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

  known(icon: string): boolean {
    return ANNOTATION_TOOLBAR_KNOWN_ICONS.has(icon);
  }

  glyph(icon: string): boolean {
    return ANNOTATION_TOOLBAR_GLYPHS.has(icon);
  }

  toolTitle(t: ToolbarTool): string {
    return resolveToolbarToolTitle(t);
  }

  tab(key: string): number {
    return key === this.activeStop() ? 0 : -1;
  }

  /** Roving tabindex: the toolbar is one Tab stop, arrows move between its enabled buttons. */
  protected onKey(e: KeyboardEvent): void {
    if (!ANNOTATION_TOOLBAR_NAV_KEYS.includes(e.key)) return;
    const els = this.buttons()
      .map((r) => r.nativeElement)
      .filter((b) => b.getAttribute('aria-disabled') !== 'true');
    const i = els.indexOf(e.target as HTMLButtonElement);
    if (i < 0 || els.length === 0) return;
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
    const next =
      e.key === 'Home' ? 0 : e.key === 'End' ? els.length - 1 : (i + step + els.length) % els.length;
    e.preventDefault();
    const key = els[next].dataset['key'];
    if (key) this.focusedKey.set(key);
    els[next].focus();
  }

  protected onToolbarFocus(e: FocusEvent): void {
    const key = (e.target as HTMLElement | null)?.dataset?.['key'];
    if (key && resolveToolbarEnabledKeys(this.model()).includes(key)) {
      this.focusedKey.set(key);
    }
  }
}
