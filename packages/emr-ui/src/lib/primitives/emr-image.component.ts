import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type {
  EmrAspectPreset,
  EmrFileSelectionItem,
  EmrImageCropRect,
  EmrImageCropResult,
  EmrImageCropTransform,
  EmrImageItem,
  EmrImageViewportState,
  EmrUploadedImageItem,
  EmrValidationMessage,
} from '@drguptavivek/emr-controller';
import {
  DEFAULT_ASPECT_PRESETS,
  DEFAULT_IMAGE_CROP_TRANSFORM,
  DEFAULT_IMAGE_VIEWPORT,
  clampCropRect,
  clampStraightenAngle,
  computeAspectLockedCropRect,
  computeCroppedCanvasPlan,
  formatImageByteSize,
  formatImageTransformCss,
  rotateImage90,
  splitRotationDegrees,
  stepImageZoom,
  validateUploadedImageFile,
} from './emr-wave2.logic';

let nextImagePrimitiveId = 0;

type CropDragMode = 'move' | 'pan' | 'nw' | 'ne' | 'sw' | 'se';

function normalizeCombinedRotation(base90: number, straighten: number): number {
  const raw = base90 + straighten;
  if (raw === 180) return 180;
  let norm = ((raw % 360) + 360) % 360;
  if (norm > 180) norm -= 360;
  return Math.round(norm * 10) / 10;
}

function rasterizeCanvasCrop(
  imgEl: HTMLImageElement | undefined,
  canvasEl: HTMLCanvasElement | undefined,
  transform: EmrImageCropTransform,
  mimeType: string,
  fallbackSrc: string,
): string {
  if (!imgEl || !canvasEl) return fallbackSrc;
  const natW = imgEl.naturalWidth || imgEl.width || 360;
  const natH = imgEl.naturalHeight || imgEl.height || 260;
  const plan = computeCroppedCanvasPlan(natW, natH, transform);
  canvasEl.width = plan.outputWidth;
  canvasEl.height = plan.outputHeight;
  try {
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return fallbackSrc;
    ctx.clearRect(0, 0, plan.outputWidth, plan.outputHeight);
    ctx.save();
    ctx.translate(plan.offsetX, plan.offsetY);
    ctx.translate(plan.centerX, plan.centerY);
    ctx.rotate(plan.rotationRad);
    ctx.scale(plan.scaleX, plan.scaleY);
    ctx.drawImage(
      imgEl,
      -plan.drawWidth / 2,
      -plan.drawHeight / 2,
      plan.drawWidth,
      plan.drawHeight,
    );
    ctx.restore();
    return canvasEl.toDataURL(mimeType || 'image/png');
  } catch {
    return fallbackSrc;
  }
}

function applyCropBoxDrag(
  mode: CropDragMode,
  startRect: EmrImageCropRect,
  dx: number,
  dy: number,
  aspectRatio: number | null,
): EmrImageCropRect {
  if (mode === 'move') {
    return clampCropRect(
      {
        x: startRect.x + dx,
        y: startRect.y + dy,
        width: startRect.width,
        height: startRect.height,
      },
      aspectRatio,
    );
  }
  const minSize = 0.1;
  let candidate: EmrImageCropRect = startRect;
  if (mode === 'se') {
    candidate = {
      x: startRect.x,
      y: startRect.y,
      width: Math.max(minSize, startRect.width + dx),
      height: Math.max(minSize, startRect.height + dy),
    };
  } else if (mode === 'nw') {
    const nextW = Math.max(minSize, startRect.width - dx);
    const nextH = Math.max(minSize, startRect.height - dy);
    candidate = {
      x: startRect.x + (startRect.width - nextW),
      y: startRect.y + (startRect.height - nextH),
      width: nextW,
      height: nextH,
    };
  } else if (mode === 'ne') {
    const nextW = Math.max(minSize, startRect.width + dx);
    const nextH = Math.max(minSize, startRect.height - dy);
    candidate = {
      x: startRect.x,
      y: startRect.y + (startRect.height - nextH),
      width: nextW,
      height: nextH,
    };
  } else if (mode === 'sw') {
    const nextW = Math.max(minSize, startRect.width - dx);
    const nextH = Math.max(minSize, startRect.height + dy);
    candidate = {
      x: startRect.x + (startRect.width - nextW),
      y: startRect.y,
      width: nextW,
      height: nextH,
    };
  }
  return computeAspectLockedCropRect(startRect, candidate, aspectRatio, minSize);
}

@Component({
  selector: 'emr-image-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '(document:keydown.escape)': 'onEscapeKey($event)',
  },
  template: `
    <div
      class="emr-image-viewer"
      [class.emr-image-viewer--fullscreen]="isFullscreen()"
      [class.emr-image-viewer--invalid]="isInvalid()"
      [class.emr-image-viewer--warning]="!isInvalid() && !!warning()"
      [class.emr-image-viewer--readonly]="readOnly()"
      [class.emr-image-viewer--disabled]="disabled()"
      [id]="resolvedId()"
      [attr.role]="isFullscreen() ? 'dialog' : 'region'"
      [attr.aria-modal]="isFullscreen() ? 'true' : null"
      [attr.aria-label]="label() || activeImage()?.alt || 'Clinical image viewer'"
      [attr.aria-invalid]="isInvalid() ? 'true' : null"
      [attr.aria-disabled]="disabled() ? 'true' : null"
      [attr.aria-describedby]="describedBy()"
      [attr.data-readonly]="readOnly() ? 'true' : null"
      tabindex="0"
      (focusin)="focused.emit()"
      (focusout)="blurred.emit()"
      (keydown)="onKeyDown($event)"
    >
      <div class="emr-image-viewer__toolbar" data-emr-print="hide">
        @if (label()) {
          <strong class="emr-field__label" [class.emr-sr-only]="labelHidden()">{{ label() }}</strong>
        }
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
          [disabled]="disabled()"
          aria-label="Zoom out"
          (click)="zoomBy(-0.25)"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16.2" y2="16.2" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
        <span class="emr-badge emr-tone-neutral">{{ zoomPercent() }}%</span>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
          [disabled]="disabled()"
          aria-label="Zoom in"
          (click)="zoomBy(0.25)"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16.2" y2="16.2" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
        <button
          type="button"
          class="emr-button emr-button--ghost emr-button--small emr-image-viewer__tool-btn"
          [disabled]="disabled()"
          aria-label="Fit image to stage"
          (click)="resetViewport()"
        >
          Fit
        </button>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
          [disabled]="disabled()"
          aria-label="Rotate counterclockwise 90 degrees"
          (click)="rotate90(false)"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
          [disabled]="disabled()"
          aria-label="Rotate clockwise 90 degrees"
          (click)="rotate90(true)"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
        <label class="emr-image-viewer__straighten">
          <span>Straighten</span>
          <input
            type="range"
            min="-45"
            max="45"
            step="1"
            [value]="straightenOffset()"
            [disabled]="disabled()"
            aria-label="Straighten angle"
            [attr.aria-valuetext]="straightenOffset() + ' degrees'"
            (input)="onStraightenInput($event)"
          />
          <span>{{ straightenOffset() }}°</span>
        </label>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
          [disabled]="disabled()"
          [attr.aria-pressed]="activeViewport().flipH ? 'true' : 'false'"
          aria-label="Flip horizontal"
          (click)="toggleFlip('H')"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="12" y1="3" x2="12" y2="21" />
            <polygon points="8 7 3 12 8 17 8 7" />
            <polygon points="16 7 21 12 16 17 16 7" />
          </svg>
          <span>Flip H</span>
        </button>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
          [disabled]="disabled()"
          [attr.aria-pressed]="activeViewport().flipV ? 'true' : 'false'"
          aria-label="Flip vertical"
          (click)="toggleFlip('V')"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="3" y1="12" x2="21" y2="12" />
            <polygon points="7 8 12 3 17 8 7 8" />
            <polygon points="7 16 12 21 17 16 7 16" />
          </svg>
          <span>Flip V</span>
        </button>
        @if (allowFullscreen()) {
          <button
            #fullscreenBtn
            type="button"
            class="emr-button emr-button--secondary emr-button--small emr-image-viewer__tool-btn"
            [disabled]="disabled()"
            [attr.aria-expanded]="isFullscreen() ? 'true' : 'false'"
            [attr.aria-label]="isFullscreen() ? 'Exit fullscreen' : 'Open fullscreen'"
            (click)="toggleFullscreen($event)"
          >
            @if (isFullscreen()) {
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="4 14 10 14 10 20" />
                <polyline points="20 10 14 10 14 4" />
                <line x1="14" y1="10" x2="21" y2="3" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
              <span>Close</span>
            } @else {
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
              <span>Fullscreen</span>
            }
          </button>
        }
      </div>

      <div
        class="emr-image-viewer__stage"
        [style.height.px]="isFullscreen() ? null : height()"
        (wheel)="onStageWheel($event)"
        (pointerdown)="onStagePointerDown($event)"
        (pointermove)="onStagePointerMove($event)"
        (pointerup)="onStagePointerUp($event)"
        (pointercancel)="onStagePointerUp($event)"
      >
        @if (activeImage(); as img) {
          <img
            class="emr-image-viewer__img"
            [src]="img.src"
            [alt]="img.alt"
            [style.transform]="transformCss()"
          />
        } @else {
          <div class="emr-empty">No image available</div>
        }
      </div>

      @if (resolvedImages().length > 1 || activeImage()?.caption) {
        <div class="emr-image-viewer__footer">
          @if (activeImage()?.caption; as cap) {
            <span class="emr-field__hint">{{ cap }}</span>
          }
          @if (resolvedImages().length > 1) {
            <div class="emr-chip-row" data-emr-print="hide">
              <button
                type="button"
                class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
                [disabled]="disabled()"
                aria-label="Previous image"
                (click)="selectImageIndex(currentIndex() - 1)"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span>Prev</span>
              </button>
              <span class="emr-badge emr-tone-neutral">{{ currentIndex() + 1 }} / {{ resolvedImages().length }}</span>
              <button
                type="button"
                class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
                [disabled]="disabled()"
                aria-label="Next image"
                (click)="selectImageIndex(currentIndex() + 1)"
              >
                <span>Next</span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          }
        </div>
      }

      @if (showThumbnails() && resolvedImages().length > 1) {
        <div class="emr-image-viewer__thumbs" role="list" aria-label="Image thumbnails" data-emr-print="hide">
          @for (item of resolvedImages(); track item.id; let idx = $index) {
            <button
              type="button"
              role="listitem"
              class="emr-image-viewer__thumb-btn"
              [attr.aria-current]="idx === currentIndex() ? 'true' : null"
              [attr.aria-label]="item.alt || 'Image ' + (idx + 1)"
              [disabled]="disabled()"
              (click)="selectImageIndex(idx)"
            >
              <img [src]="item.src" [alt]="item.alt || item.id" />
            </button>
          }
        </div>
      }

      @if (hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (warning()) {
        <span class="emr-field__warning" role="status" [id]="resolvedId() + '-warning'">{{ warning() }}</span>
      }
      @if (error()) {
        <span class="emr-field__error" role="alert" [id]="resolvedId() + '-error'">{{ error() }}</span>
      }
    </div>
  `,
})
export class EmrImageViewerComponent {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly src = input<string | null>(null);
  readonly alt = input('Clinical image');
  readonly caption = input<string>();
  readonly images = input<readonly EmrImageItem[]>([]);
  readonly activeIndex = input<number | undefined>(undefined);
  readonly viewport = input<EmrImageViewportState | undefined>(undefined);
  readonly fullscreen = input<boolean | undefined>(undefined);
  readonly allowFullscreen = input(true, { transform: booleanAttribute });
  readonly showThumbnails = input(true, { transform: booleanAttribute });
  readonly height = input(300);
  readonly hint = input('');
  readonly warning = input('');
  readonly error = input('');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly activeIndexChange = output<number>();
  readonly fullscreenChange = output<boolean>();
  readonly viewportChange = output<EmrImageViewportState>();
  readonly closeRequested = output<void>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-image-viewer-${++nextImagePrimitiveId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly localIndex = signal(0);
  protected readonly localFullscreen = signal(false);
  protected readonly localViewport = signal<EmrImageViewportState>({ ...DEFAULT_IMAGE_VIEWPORT });

  private readonly fullscreenBtnRef = viewChild<ElementRef<HTMLButtonElement>>('fullscreenBtn');
  private fullscreenTriggerEl: HTMLElement | null = null;
  private activePointerId: number | null = null;
  private dragOriginX = 0;
  private dragOriginY = 0;
  private startPanX = 0;
  private startPanY = 0;

  protected readonly isInvalid = computed(() => this.invalid() || Boolean(this.error()));
  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.hint()) ids.push(`${this.resolvedId()}-hint`);
    if (this.warning()) ids.push(`${this.resolvedId()}-warning`);
    if (this.error()) ids.push(`${this.resolvedId()}-error`);
    return ids.length > 0 ? ids.join(' ') : null;
  });

  protected readonly resolvedImages = computed<readonly EmrImageItem[]>(() => {
    const list = this.images();
    if (list.length > 0) return list;
    const singleSrc = this.src();
    if (!singleSrc) return [];
    return [
      {
        id: 'single',
        src: singleSrc,
        alt: this.alt() || 'Clinical image',
        caption: this.caption(),
      },
    ];
  });

  protected readonly currentIndex = computed(() => {
    const total = this.resolvedImages().length;
    if (total === 0) return 0;
    const idx = this.activeIndex() ?? this.localIndex();
    return Math.max(0, Math.min(total - 1, idx));
  });

  protected readonly activeImage = computed<EmrImageItem | null>(
    () => this.resolvedImages()[this.currentIndex()] ?? null,
  );

  protected readonly activeViewport = computed<EmrImageViewportState>(
    () => this.viewport() ?? this.localViewport(),
  );

  protected readonly rotationParts = computed(() =>
    splitRotationDegrees(this.activeViewport().rotationDeg),
  );
  protected readonly straightenOffset = computed(() => this.rotationParts().straighten);

  protected readonly isFullscreen = computed(() => {
    const controlled = this.fullscreen();
    return controlled !== undefined ? controlled : this.localFullscreen();
  });

  protected readonly zoomPercent = computed(() => Math.round(this.activeViewport().zoom * 100));
  protected readonly transformCss = computed(() => formatImageTransformCss(this.activeViewport()));

  protected onEscapeKey(event: Event): void {
    if (this.isFullscreen()) {
      event.preventDefault();
      this.setFullscreen(false);
    }
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const tag = (event.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (event.key === 'Escape' && this.isFullscreen()) {
      event.preventDefault();
      this.setFullscreen(false);
      return;
    }
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      this.zoomBy(0.25);
    } else if (event.key === '-') {
      event.preventDefault();
      this.zoomBy(-0.25);
    } else if (event.key === '0') {
      event.preventDefault();
      this.resetViewport();
    } else if (event.key === 'r' || event.key === 'R') {
      event.preventDefault();
      this.rotate90(true);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (this.resolvedImages().length > 1) {
        this.selectImageIndex(this.currentIndex() - 1);
      } else {
        this.updateViewport({ ...this.activeViewport(), panX: this.activeViewport().panX - 24 });
      }
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (this.resolvedImages().length > 1) {
        this.selectImageIndex(this.currentIndex() + 1);
      } else {
        this.updateViewport({ ...this.activeViewport(), panX: this.activeViewport().panX + 24 });
      }
    }
  }

  protected onStageWheel(event: WheelEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.zoomBy(event.deltaY < 0 ? 0.15 : -0.15);
  }

  protected zoomBy(delta: number): void {
    if (this.disabled()) return;
    const cur = this.activeViewport();
    this.updateViewport({
      ...cur,
      zoom: stepImageZoom(cur.zoom, delta),
    });
  }

  protected rotate90(clockwise: boolean): void {
    if (this.disabled()) return;
    const parts = this.rotationParts();
    const nextBase = rotateImage90(parts.base90, clockwise);
    this.updateViewport({
      ...this.activeViewport(),
      rotationDeg: normalizeCombinedRotation(nextBase, parts.straighten),
    });
  }

  protected onStraightenInput(event: Event): void {
    if (this.disabled()) return;
    const deg = Number((event.target as HTMLInputElement).value);
    const clamped = Math.max(-45, Math.min(45, Number.isFinite(deg) ? deg : 0));
    const parts = this.rotationParts();
    this.updateViewport({
      ...this.activeViewport(),
      rotationDeg: normalizeCombinedRotation(parts.base90, clamped),
    });
  }

  protected toggleFlip(axis: 'H' | 'V'): void {
    if (this.disabled()) return;
    const cur = this.activeViewport();
    this.updateViewport({
      ...cur,
      flipH: axis === 'H' ? !cur.flipH : cur.flipH,
      flipV: axis === 'V' ? !cur.flipV : cur.flipV,
    });
  }

  protected resetViewport(): void {
    if (this.disabled()) return;
    this.updateViewport({ ...DEFAULT_IMAGE_VIEWPORT });
  }

  protected toggleFullscreen(event?: Event): void {
    if (this.disabled()) return;
    const next = !this.isFullscreen();
    if (next) {
      if (!this.allowFullscreen()) return;
      this.fullscreenTriggerEl = (event?.currentTarget as HTMLElement | null) ?? null;
    }
    this.setFullscreen(next);
  }

  protected selectImageIndex(index: number): void {
    if (this.disabled()) return;
    const total = this.resolvedImages().length;
    if (total === 0) return;
    const bounded = ((index % total) + total) % total;
    this.localIndex.set(bounded);
    this.resetViewport();
    this.activeIndexChange.emit(bounded);
  }

  protected onStagePointerDown(event: PointerEvent): void {
    if (this.disabled()) return;
    const stage = event.currentTarget as HTMLElement;
    if (typeof stage.setPointerCapture === 'function') {
      stage.setPointerCapture(event.pointerId);
    }
    this.activePointerId = event.pointerId;
    this.dragOriginX = event.clientX;
    this.dragOriginY = event.clientY;
    const vp = this.activeViewport();
    this.startPanX = vp.panX;
    this.startPanY = vp.panY;
  }

  protected onStagePointerMove(event: PointerEvent): void {
    if (this.disabled() || this.activePointerId !== event.pointerId) return;
    const dx = event.clientX - this.dragOriginX;
    const dy = event.clientY - this.dragOriginY;
    this.updateViewport({
      ...this.activeViewport(),
      panX: Math.round(this.startPanX + dx),
      panY: Math.round(this.startPanY + dy),
    });
  }

  protected onStagePointerUp(event: PointerEvent): void {
    if (this.activePointerId !== event.pointerId) return;
    const stage = event.currentTarget as HTMLElement;
    if (typeof stage.releasePointerCapture === 'function') {
      stage.releasePointerCapture(event.pointerId);
    }
    this.activePointerId = null;
  }

  private setFullscreen(next: boolean): void {
    if (next && !this.allowFullscreen()) return;
    this.localFullscreen.set(next);
    this.fullscreenChange.emit(next);
    if (next) {
      queueMicrotask(() => {
        this.fullscreenBtnRef()?.nativeElement?.focus();
      });
    } else {
      this.closeRequested.emit();
      const trigger = this.fullscreenTriggerEl;
      this.fullscreenTriggerEl = null;
      if (trigger) {
        queueMicrotask(() => trigger.focus());
      }
    }
  }

  private updateViewport(next: EmrImageViewportState): void {
    this.localViewport.set(next);
    this.viewportChange.emit(next);
  }
}

@Component({
  selector: 'emr-image-cropper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="emr-image-viewer"
      [class.emr-image-viewer--invalid]="isInvalid()"
      [class.emr-image-viewer--warning]="!isInvalid() && !!warning()"
      [class.emr-image-viewer--readonly]="readOnly()"
      [class.emr-image-viewer--disabled]="disabled()"
      [id]="resolvedId()"
      role="group"
      [attr.aria-label]="label() || 'Image cropper'"
      [attr.aria-invalid]="isInvalid() ? 'true' : null"
      [attr.aria-disabled]="disabled() ? 'true' : null"
      [attr.aria-describedby]="describedBy()"
      [attr.data-readonly]="readOnly() ? 'true' : null"
      (focusin)="focused.emit()"
      (focusout)="blurred.emit()"
    >
      @if (label()) {
        <strong class="emr-field__label" [class.emr-sr-only]="labelHidden()">{{ label() }}</strong>
      }

      <div class="emr-image-viewer__toolbar" data-emr-print="hide">
        <div
          class="emr-chip-row"
          role="radiogroup"
          aria-label="Aspect ratio presets"
          (keydown)="onPresetGroupKeyDown($event)"
        >
          @for (preset of resolvedPresets(); track preset.id; let idx = $index) {
            <button
              type="button"
              role="radio"
              class="emr-button emr-button--small emr-image-viewer__tool-btn"
              [class.emr-button--primary]="currentTransform().aspectRatio === preset.ratio"
              [class.emr-button--outline]="currentTransform().aspectRatio !== preset.ratio"
              [attr.aria-checked]="currentTransform().aspectRatio === preset.ratio ? 'true' : 'false'"
              [attr.tabindex]="idx === focusedPresetIndex() ? 0 : -1"
              [disabled]="disabled() || readOnly()"
              (click)="selectAspectPreset(preset, idx)"
            >
              {{ preset.label }}
            </button>
          }
        </div>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
          [disabled]="disabled() || readOnly()"
          aria-label="Zoom out"
          (click)="zoomBy(-0.25)"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16.2" y2="16.2" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
        <span class="emr-badge emr-tone-neutral">{{ zoomPercent() }}%</span>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
          [disabled]="disabled() || readOnly()"
          aria-label="Zoom in"
          (click)="zoomBy(0.25)"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16.2" y2="16.2" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
          [disabled]="disabled() || readOnly()"
          aria-label="Rotate counterclockwise 90 degrees"
          (click)="rotate90(false)"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
          [disabled]="disabled() || readOnly()"
          aria-label="Rotate clockwise 90 degrees"
          (click)="rotate90(true)"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
        <label class="emr-image-viewer__straighten">
          <span>Straighten</span>
          <input
            type="range"
            min="-45"
            max="45"
            step="1"
            [value]="straightenOffset()"
            [disabled]="disabled() || readOnly()"
            aria-label="Straighten crop angle"
            [attr.aria-valuetext]="straightenOffset() + ' degrees'"
            (input)="onStraightenInput($event)"
          />
          <span>{{ straightenOffset() }}°</span>
        </label>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
          [disabled]="disabled() || readOnly()"
          [attr.aria-pressed]="currentTransform().flipH ? 'true' : 'false'"
          aria-label="Flip horizontal"
          (click)="toggleFlip('H')"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="12" y1="3" x2="12" y2="21" />
            <polygon points="8 7 3 12 8 17 8 7" />
            <polygon points="16 7 21 12 16 17 16 7" />
          </svg>
          <span>Flip H</span>
        </button>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
          [disabled]="disabled() || readOnly()"
          [attr.aria-pressed]="currentTransform().flipV ? 'true' : 'false'"
          aria-label="Flip vertical"
          (click)="toggleFlip('V')"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="3" y1="12" x2="21" y2="12" />
            <polygon points="7 8 12 3 17 8 7 8" />
            <polygon points="7 16 12 21 17 16 7 16" />
          </svg>
          <span>Flip V</span>
        </button>
      </div>

      <div
        #stageEl
        class="emr-image-viewer__stage"
        (pointerdown)="startStagePan($event)"
        (pointermove)="onStagePointerMove($event)"
        (pointerup)="onStagePointerUp($event)"
        (pointercancel)="onStagePointerUp($event)"
      >
        @if (src()) {
          <img
            #cropImg
            class="emr-image-viewer__img"
            [src]="src()!"
            [alt]="alt()"
            [style.transform]="imageTransformCss()"
          />
          <div
            class="emr-image-cropper__box"
            role="group"
            tabindex="0"
            aria-label="Crop region. Use arrow keys to move, Shift plus arrow keys to resize."
            [style.left.%]="currentTransform().rect.x * 100"
            [style.top.%]="currentTransform().rect.y * 100"
            [style.width.%]="currentTransform().rect.width * 100"
            [style.height.%]="currentTransform().rect.height * 100"
            (pointerdown)="startCropDrag('move', $event)"
            (keydown)="onCropBoxKeyDown($event)"
          >
            <div class="emr-image-cropper__grid" aria-hidden="true"></div>
            <span class="emr-image-cropper__readout" aria-hidden="true">{{ rectPercentLabel() }}</span>
            <button
              type="button"
              class="emr-image-cropper__handle emr-image-cropper__handle--nw"
              aria-label="Resize crop region top-left"
              [disabled]="disabled() || readOnly()"
              (pointerdown)="startCropDrag('nw', $event)"
            ></button>
            <button
              type="button"
              class="emr-image-cropper__handle emr-image-cropper__handle--ne"
              aria-label="Resize crop region top-right"
              [disabled]="disabled() || readOnly()"
              (pointerdown)="startCropDrag('ne', $event)"
            ></button>
            <button
              type="button"
              class="emr-image-cropper__handle emr-image-cropper__handle--sw"
              aria-label="Resize crop region bottom-left"
              [disabled]="disabled() || readOnly()"
              (pointerdown)="startCropDrag('sw', $event)"
            ></button>
            <button
              type="button"
              class="emr-image-cropper__handle emr-image-cropper__handle--se"
              aria-label="Resize crop region bottom-right"
              [disabled]="disabled() || readOnly()"
              (pointerdown)="startCropDrag('se', $event)"
            ></button>
          </div>
        } @else {
          <div class="emr-empty">No image loaded for cropping</div>
        }
        <canvas #cropCanvas hidden aria-hidden="true"></canvas>
      </div>

      <div class="emr-image-viewer__footer" data-emr-print="hide">
        <div class="emr-chip-row">
          <button
            type="button"
            class="emr-button emr-button--ghost emr-button--small emr-image-viewer__tool-btn"
            [disabled]="disabled() || readOnly()"
            (click)="resetCrop()"
          >
            Reset
          </button>
          <button
            type="button"
            class="emr-button emr-button--ghost emr-button--small emr-image-viewer__tool-btn"
            [disabled]="disabled() || readOnly()"
            (click)="nudgeCropSize(-0.05)"
          >
            Crop smaller
          </button>
          <button
            type="button"
            class="emr-button emr-button--ghost emr-button--small emr-image-viewer__tool-btn"
            [disabled]="disabled() || readOnly()"
            (click)="nudgeCropSize(0.05)"
          >
            Crop larger
          </button>
        </div>
        <div class="emr-chip-row">
          <button
            type="button"
            class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
            [disabled]="disabled()"
            (click)="cancelRequested.emit()"
          >
            Cancel
          </button>
          <button
            type="button"
            class="emr-button emr-button--primary emr-button--small emr-image-viewer__tool-btn"
            [disabled]="disabled() || readOnly() || !src()"
            (click)="applyCrop()"
          >
            Apply crop
          </button>
        </div>
      </div>

      @if (hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (warning()) {
        <span class="emr-field__warning" role="status" [id]="resolvedId() + '-warning'">{{ warning() }}</span>
      }
      @if (error()) {
        <span class="emr-field__error" role="alert" [id]="resolvedId() + '-error'">{{ error() }}</span>
      }
    </div>
  `,
})
export class EmrImageCropperComponent {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly src = input<string | null>(null);
  readonly alt = input('Image to crop');
  readonly aspectPresets = input<readonly EmrAspectPreset[]>(DEFAULT_ASPECT_PRESETS);
  readonly transform = input<EmrImageCropTransform | undefined>(undefined);
  readonly initialTransform = input<EmrImageCropTransform | undefined>(undefined);
  readonly outputMimeType = input('image/png');
  readonly hint = input('');
  readonly warning = input('');
  readonly error = input('');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly cropChange = output<EmrImageCropTransform>();
  readonly cropCommitted = output<EmrImageCropResult>();
  readonly cancelRequested = output<void>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-image-cropper-${++nextImagePrimitiveId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly draftTransform = signal<EmrImageCropTransform | null>(null);
  private readonly controlledTransform = computed(() => this.transform() ?? this.initialTransform());

  private readonly stageRef = viewChild<ElementRef<HTMLElement>>('stageEl');
  private readonly cropImgRef = viewChild<ElementRef<HTMLImageElement>>('cropImg');
  private readonly cropCanvasRef = viewChild<ElementRef<HTMLCanvasElement>>('cropCanvas');

  private dragMode: CropDragMode | null = null;
  private activePointerId: number | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private startRect: EmrImageCropRect = DEFAULT_IMAGE_CROP_TRANSFORM.rect;
  private startPanX = 0;
  private startPanY = 0;

  constructor() {
    effect(() => {
      this.controlledTransform();
      this.draftTransform.set(null);
    });
  }

  protected readonly isInvalid = computed(() => this.invalid() || Boolean(this.error()));
  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.hint()) ids.push(`${this.resolvedId()}-hint`);
    if (this.warning()) ids.push(`${this.resolvedId()}-warning`);
    if (this.error()) ids.push(`${this.resolvedId()}-error`);
    return ids.length > 0 ? ids.join(' ') : null;
  });

  protected readonly resolvedPresets = computed<readonly EmrAspectPreset[]>(() => {
    const p = this.aspectPresets();
    return p.length > 0 ? p : DEFAULT_ASPECT_PRESETS;
  });

  protected readonly currentTransform = computed<EmrImageCropTransform>(
    () => this.draftTransform() ?? this.controlledTransform() ?? DEFAULT_IMAGE_CROP_TRANSFORM,
  );

  protected readonly focusedPresetIndex = computed(() => {
    const idx = this.resolvedPresets().findIndex(
      (p) => p.ratio === this.currentTransform().aspectRatio,
    );
    return idx >= 0 ? idx : 0;
  });

  protected readonly rotationParts = computed(() =>
    splitRotationDegrees(this.currentTransform().rotationDeg),
  );
  protected readonly straightenOffset = computed(() => this.rotationParts().straighten);
  protected readonly zoomPercent = computed(() => Math.round(this.currentTransform().zoom * 100));
  protected readonly rectPercentLabel = computed(() => {
    const r = this.currentTransform().rect;
    return `${Math.round(r.width * 100)}% × ${Math.round(r.height * 100)}%`;
  });

  protected readonly imageTransformCss = computed(() => {
    const t = this.currentTransform();
    return formatImageTransformCss({
      zoom: t.zoom,
      panX: t.panX,
      panY: t.panY,
      rotationDeg: t.rotationDeg,
      flipH: t.flipH,
      flipV: t.flipV,
    });
  });

  protected selectAspectPreset(preset: EmrAspectPreset, _index?: number): void {
    if (this.disabled() || this.readOnly()) return;
    const cur = this.currentTransform();
    const nextRect = clampCropRect(cur.rect, preset.ratio);
    this.emitTransform({
      ...cur,
      aspectRatio: preset.ratio,
      rect: nextRect,
    });
  }

  protected onPresetGroupKeyDown(event: KeyboardEvent): void {
    if (this.disabled() || this.readOnly()) return;
    const presets = this.resolvedPresets();
    if (presets.length === 0) return;
    const curIdx = this.focusedPresetIndex();
    let nextIdx = -1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIdx = (curIdx + 1) % presets.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIdx = (curIdx - 1 + presets.length) % presets.length;
    } else if (event.key === 'Home') {
      nextIdx = 0;
    } else if (event.key === 'End') {
      nextIdx = presets.length - 1;
    }
    if (nextIdx >= 0) {
      event.preventDefault();
      this.selectAspectPreset(presets[nextIdx]!, nextIdx);
      const group = event.currentTarget as HTMLElement | null;
      const radios = group ? Array.from(group.children) as HTMLElement[] : [];
      radios[nextIdx]?.focus();
    }
  }

  protected zoomBy(delta: number): void {
    if (this.disabled() || this.readOnly()) return;
    const cur = this.currentTransform();
    this.emitTransform({
      ...cur,
      zoom: stepImageZoom(cur.zoom, delta),
    });
  }

  protected rotate90(clockwise: boolean): void {
    if (this.disabled() || this.readOnly()) return;
    const parts = this.rotationParts();
    const nextBase = rotateImage90(parts.base90, clockwise);
    const cur = this.currentTransform();
    this.emitTransform({
      ...cur,
      rotationDeg: normalizeCombinedRotation(nextBase, parts.straighten),
    });
  }

  protected onStraightenInput(event: Event): void {
    if (this.disabled() || this.readOnly()) return;
    const deg = Number((event.target as HTMLInputElement).value);
    const clamped = Math.max(-45, Math.min(45, Number.isFinite(deg) ? deg : 0));
    const parts = this.rotationParts();
    const cur = this.currentTransform();
    this.emitTransform({
      ...cur,
      rotationDeg: normalizeCombinedRotation(parts.base90, clamped),
    });
  }

  protected toggleFlip(axis: 'H' | 'V'): void {
    if (this.disabled() || this.readOnly()) return;
    const cur = this.currentTransform();
    this.emitTransform({
      ...cur,
      flipH: axis === 'H' ? !cur.flipH : cur.flipH,
      flipV: axis === 'V' ? !cur.flipV : cur.flipV,
    });
  }

  protected nudgeCropSize(delta: number): void {
    if (this.disabled() || this.readOnly()) return;
    const cur = this.currentTransform();
    const nextRect = computeAspectLockedCropRect(
      cur.rect,
      {
        x: cur.rect.x - delta / 2,
        y: cur.rect.y - delta / 2,
        width: cur.rect.width + delta,
        height: cur.rect.height + delta,
      },
      cur.aspectRatio,
    );
    this.emitTransform({ ...cur, rect: nextRect });
  }

  protected onCropBoxKeyDown(event: KeyboardEvent): void {
    if (this.disabled() || this.readOnly()) return;
    const cur = this.currentTransform();
    const moveStep = 0.02;
    const resizeStep = 0.05;
    let nextRect: EmrImageCropRect | null = null;
    if (event.shiftKey) {
      if (event.key === 'ArrowRight') {
        nextRect = computeAspectLockedCropRect(
          cur.rect,
          { ...cur.rect, width: cur.rect.width + resizeStep },
          cur.aspectRatio,
        );
      } else if (event.key === 'ArrowLeft') {
        nextRect = computeAspectLockedCropRect(
          cur.rect,
          { ...cur.rect, width: cur.rect.width - resizeStep },
          cur.aspectRatio,
        );
      } else if (event.key === 'ArrowDown') {
        nextRect = computeAspectLockedCropRect(
          cur.rect,
          { ...cur.rect, height: cur.rect.height + resizeStep },
          cur.aspectRatio,
        );
      } else if (event.key === 'ArrowUp') {
        nextRect = computeAspectLockedCropRect(
          cur.rect,
          { ...cur.rect, height: cur.rect.height - resizeStep },
          cur.aspectRatio,
        );
      }
    } else {
      if (event.key === 'ArrowRight') {
        nextRect = clampCropRect({ ...cur.rect, x: cur.rect.x + moveStep }, cur.aspectRatio);
      } else if (event.key === 'ArrowLeft') {
        nextRect = clampCropRect({ ...cur.rect, x: cur.rect.x - moveStep }, cur.aspectRatio);
      } else if (event.key === 'ArrowDown') {
        nextRect = clampCropRect({ ...cur.rect, y: cur.rect.y + moveStep }, cur.aspectRatio);
      } else if (event.key === 'ArrowUp') {
        nextRect = clampCropRect({ ...cur.rect, y: cur.rect.y - moveStep }, cur.aspectRatio);
      }
    }
    if (nextRect) {
      event.preventDefault();
      this.emitTransform({ ...cur, rect: nextRect });
    }
  }

  protected resetCrop(): void {
    if (this.disabled() || this.readOnly()) return;
    this.emitTransform({ ...DEFAULT_IMAGE_CROP_TRANSFORM });
  }

  protected applyCrop(): void {
    const src = this.src();
    if (this.disabled() || this.readOnly() || !src) return;
    const transform = this.currentTransform();
    const croppedDataUrl = rasterizeCanvasCrop(
      this.cropImgRef()?.nativeElement,
      this.cropCanvasRef()?.nativeElement,
      transform,
      this.outputMimeType(),
      src,
    );
    this.cropCommitted.emit({
      transform,
      croppedDataUrl,
    });
  }

  protected startStagePan(event: PointerEvent): void {
    if (this.disabled() || this.readOnly() || !this.src()) return;
    const stage = this.stageRef()?.nativeElement;
    if (stage && typeof stage.setPointerCapture === 'function') {
      stage.setPointerCapture(event.pointerId);
    }
    this.dragMode = 'pan';
    this.activePointerId = event.pointerId;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    const cur = this.currentTransform();
    this.startPanX = cur.panX;
    this.startPanY = cur.panY;
  }

  protected startCropDrag(mode: Exclude<CropDragMode, 'pan'>, event: PointerEvent): void {
    if (this.disabled() || this.readOnly()) return;
    event.stopPropagation();
    event.preventDefault();
    const stage = this.stageRef()?.nativeElement;
    if (stage && typeof stage.setPointerCapture === 'function') {
      stage.setPointerCapture(event.pointerId);
    }
    this.dragMode = mode;
    this.activePointerId = event.pointerId;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.startRect = this.currentTransform().rect;
  }

  protected onStagePointerMove(event: PointerEvent): void {
    if (
      this.disabled() ||
      this.readOnly() ||
      !this.dragMode ||
      this.activePointerId !== event.pointerId
    ) {
      return;
    }
    const cur = this.currentTransform();
    if (this.dragMode === 'pan') {
      const dxPx = event.clientX - this.dragStartX;
      const dyPx = event.clientY - this.dragStartY;
      this.emitTransform({
        ...cur,
        panX: Math.round(this.startPanX + dxPx),
        panY: Math.round(this.startPanY + dyPx),
      });
      return;
    }
    const stage = this.stageRef()?.nativeElement;
    if (!stage) return;
    const bounds = stage.getBoundingClientRect();
    const widthPx = bounds.width > 0 ? bounds.width : 300;
    const heightPx = bounds.height > 0 ? bounds.height : 240;
    const dx = (event.clientX - this.dragStartX) / widthPx;
    const dy = (event.clientY - this.dragStartY) / heightPx;
    const nextRect = applyCropBoxDrag(this.dragMode, this.startRect, dx, dy, cur.aspectRatio);
    this.emitTransform({ ...cur, rect: nextRect });
  }

  protected onStagePointerUp(event: PointerEvent): void {
    if (this.activePointerId !== event.pointerId) return;
    const stage = this.stageRef()?.nativeElement;
    if (stage && typeof stage.releasePointerCapture === 'function') {
      stage.releasePointerCapture(event.pointerId);
    }
    this.dragMode = null;
    this.activePointerId = null;
  }

  private emitTransform(next: EmrImageCropTransform): void {
    this.draftTransform.set(next);
    this.cropChange.emit(next);
  }
}

@Component({
  selector: 'emr-image-upload',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '(document:keydown.escape)': 'onEscapeKey($event)',
  },
  template: `
    <div
      class="emr-field"
      [id]="resolvedId()"
      [attr.data-readonly]="readOnly() ? 'true' : null"
      (focusin)="focused.emit()"
      (focusout)="blurred.emit()"
    >
      @if (label()) {
        <span class="emr-field__label" [class.emr-sr-only]="labelHidden()">
          {{ label() }}
          @if (required()) {
            <span class="emr-field__required" aria-hidden="true">*</span>
          }
        </span>
      }

      @if (!readOnly()) {
        <div
          class="emr-file-trigger"
          [class.emr-file-trigger--invalid]="isInvalid()"
          [class.emr-file-trigger--warning]="!isInvalid() && hasWarning()"
          [class.emr-file-trigger--disabled]="disabled() || isAtMaxLimit()"
          [attr.data-dragover]="dragOver() || null"
          data-emr-print="hide"
          (dragover)="onDragOver($event)"
          (dragleave)="dragOver.set(false)"
          (drop)="onDrop($event)"
        >
          <input
            #fileInput
            type="file"
            class="emr-sr-only"
            [id]="resolvedId() + '-file'"
            [accept]="accept()"
            [multiple]="multiple()"
            [disabled]="disabled() || isAtMaxLimit()"
            [attr.aria-invalid]="isInvalid() ? 'true' : null"
            [attr.aria-required]="required() ? 'true' : null"
            [attr.aria-describedby]="describedBy()"
            (change)="onFileChange($event)"
          />
          @if (allowCamera()) {
            <input
              #cameraInput
              type="file"
              class="emr-sr-only"
              [id]="resolvedId() + '-camera'"
              accept="image/*"
              capture="environment"
              [disabled]="disabled() || isAtMaxLimit()"
              (change)="onFileChange($event)"
            />
          }
          <div class="emr-chip-row">
            <button
              type="button"
              class="emr-button emr-button--outline emr-image-upload__action-btn"
              [disabled]="disabled() || isAtMaxLimit()"
              (click)="openFileDialog()"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>{{ resolvedButtonLabel() }}</span>
            </button>
            @if (allowCamera()) {
              <button
                type="button"
                class="emr-button emr-button--secondary emr-image-upload__action-btn"
                [disabled]="disabled() || isAtMaxLimit()"
                (click)="openCameraCapture()"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span>Take photo</span>
              </button>
            }
          </div>
          <span class="emr-field__hint">{{ dropHint() }}</span>
          @if (capacityText() || maxSizeText()) {
            <span class="emr-field__hint">
              {{ capacityText() }}{{ capacityText() && maxSizeText() ? ' · ' : '' }}{{ maxSizeText() }}
            </span>
          }
        </div>
      } @else if (items().length === 0) {
        <div class="emr-empty">{{ emptyLabel() }}</div>
      }

      @if (items().length > 0) {
        <div class="emr-image-upload__grid" role="list" aria-label="Uploaded images">
          @for (item of items(); track item.id; let idx = $index) {
            <div
              class="emr-image-upload__card"
              [class.emr-image-upload__card--readonly]="readOnly()"
              role="listitem"
            >
              <div class="emr-image-upload__thumb-wrap">
                <img
                  class="emr-image-upload__thumb"
                  [src]="item.previewSrc || item.src"
                  [alt]="item.alt || item.caption || item.name"
                />
                @if (item.cropTransform) {
                  <span class="emr-badge emr-tone-info emr-image-upload__edited-badge">Edited</span>
                }
              </div>
              <div class="emr-image-upload__body">
                <div class="emr-image-upload__meta">
                  <strong class="emr-image-upload__name">{{ item.name }}</strong>
                  @if (formatByteLabel(item.sizeBytes); as sizeText) {
                    <span class="emr-field__hint">{{ sizeText }}</span>
                  }
                </div>
                <input
                  type="text"
                  class="emr-control emr-image-upload__caption"
                  [value]="item.caption ?? ''"
                  [readOnly]="readOnly()"
                  [disabled]="disabled()"
                  placeholder="Add clinical caption…"
                  [attr.aria-label]="'Caption for ' + item.name"
                  (input)="onCaptionInput(item.id, $event)"
                />
                <div class="emr-image-upload__actions" data-emr-print="hide">
                  <button
                    type="button"
                    class="emr-button emr-button--ghost emr-button--small emr-image-upload__action-btn"
                    [disabled]="disabled()"
                    [attr.aria-label]="'View ' + item.name"
                    (click)="openViewer(idx, $event)"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>View</span>
                  </button>
                  @if (!readOnly()) {
                    <button
                      type="button"
                      class="emr-button emr-button--outline emr-button--small emr-image-upload__action-btn"
                      [disabled]="disabled()"
                      [attr.aria-label]="'Crop or rotate ' + item.name"
                      (click)="openCropper(item, $event)"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M6 2v14a2 2 0 0 0 2 2h14" />
                        <path d="M18 22V8a2 2 0 0 0-2-2H2" />
                      </svg>
                      <span>Crop / Rotate</span>
                    </button>
                    <button
                      type="button"
                      class="emr-button emr-button--ghost emr-button--small emr-image-upload__action-btn emr-image-upload__action-btn--danger"
                      [disabled]="disabled()"
                      [attr.aria-label]="'Remove ' + item.name"
                      (click)="removeItem(item.id)"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      <span>Remove</span>
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }

      @if (hasAnyMessage()) {
        <div [id]="resolvedId() + '-message'">
          @if (hint()) {
            <div class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</div>
          }
          @if (info()) {
            <div class="emr-field__info" role="status">{{ info() }}</div>
          }
          @if (warning()) {
            <div class="emr-field__warning" role="status">{{ warning() }}</div>
          }
          @if (effectiveError()) {
            <div class="emr-field__error" role="alert" [id]="resolvedId() + '-error'">{{ effectiveError() }}</div>
          }
          @for (msg of messages(); track $index) {
            <div
              [class]="'emr-field__' + msg.severity"
              [attr.role]="msg.severity === 'error' ? 'alert' : 'status'"
            >
              {{ msg.message }}
            </div>
          }
        </div>
      }

      @if (viewingItem(); as vItem) {
        <div class="emr-dialog-backdrop" role="dialog" aria-modal="true" [attr.aria-label]="'Viewing ' + vItem.name">
          <div class="emr-dialog emr-dialog--lg">
            <div class="emr-dialog__header">
              <h3 class="emr-dialog__title">{{ vItem.name }}</h3>
              <button
                #modalCloseBtn
                type="button"
                class="emr-button emr-button--ghost emr-button--small emr-image-viewer__tool-btn"
                aria-label="Close image preview"
                (click)="closeModals()"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span>Close</span>
              </button>
            </div>
            <div class="emr-dialog__body">
              <div class="emr-image-viewer" (keydown)="onModalViewerKeyDown($event)" tabindex="0">
                <div class="emr-image-viewer__toolbar">
                  <button
                    type="button"
                    class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
                    aria-label="Zoom out"
                    (click)="viewerZoomBy(-0.25)"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="7" />
                      <line x1="20" y1="20" x2="16.2" y2="16.2" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                  </button>
                  <span class="emr-badge emr-tone-neutral">{{ viewerZoomPercent() }}%</span>
                  <button
                    type="button"
                    class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
                    aria-label="Zoom in"
                    (click)="viewerZoomBy(0.25)"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="7" />
                      <line x1="20" y1="20" x2="16.2" y2="16.2" />
                      <line x1="11" y1="8" x2="11" y2="14" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="emr-button emr-button--ghost emr-button--small emr-image-viewer__tool-btn"
                    (click)="viewerReset()"
                  >
                    Fit
                  </button>
                  <button
                    type="button"
                    class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
                    aria-label="Rotate counterclockwise 90 degrees"
                    (click)="viewerRotate90(false)"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
                    aria-label="Rotate clockwise 90 degrees"
                    (click)="viewerRotate90(true)"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                  </button>
                  <label class="emr-image-viewer__straighten">
                    <span>Straighten</span>
                    <input
                      type="range"
                      min="-45"
                      max="45"
                      step="1"
                      [value]="viewerStraightenOffset()"
                      aria-label="Straighten preview angle"
                      (input)="onViewerStraightenInput($event)"
                    />
                  </label>
                  <button
                    type="button"
                    class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
                    [attr.aria-pressed]="viewerState().flipH ? 'true' : 'false'"
                    aria-label="Flip horizontal"
                    (click)="viewerToggleFlip('H')"
                  >
                    Flip H
                  </button>
                  <button
                    type="button"
                    class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
                    [attr.aria-pressed]="viewerState().flipV ? 'true' : 'false'"
                    aria-label="Flip vertical"
                    (click)="viewerToggleFlip('V')"
                  >
                    Flip V
                  </button>
                </div>
                <div
                  class="emr-image-viewer__stage"
                  (wheel)="onViewerStageWheel($event)"
                  (pointerdown)="onViewerPointerDown($event)"
                  (pointermove)="onViewerPointerMove($event)"
                  (pointerup)="onViewerPointerUp($event)"
                  (pointercancel)="onViewerPointerUp($event)"
                >
                  <img
                    class="emr-image-viewer__img"
                    [src]="vItem.previewSrc || vItem.src"
                    [alt]="vItem.alt || vItem.name"
                    [style.transform]="viewerTransformCss()"
                  />
                </div>
                @if (items().length > 1 || vItem.caption) {
                  <div class="emr-image-viewer__footer">
                    @if (vItem.caption) {
                      <span class="emr-field__hint">{{ vItem.caption }}</span>
                    }
                    @if (items().length > 1) {
                      <div class="emr-chip-row">
                        <button
                          type="button"
                          class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
                          (click)="stepViewingIndex(-1)"
                        >
                          Prev
                        </button>
                        <span class="emr-badge emr-tone-neutral">{{ (viewingIndex() ?? 0) + 1 }} / {{ items().length }}</span>
                        <button
                          type="button"
                          class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
                          (click)="stepViewingIndex(1)"
                        >
                          Next
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      @if (croppingItem(); as cItem) {
        <div class="emr-dialog-backdrop" role="dialog" aria-modal="true" [attr.aria-label]="'Crop ' + cItem.name">
          <div class="emr-dialog emr-dialog--lg">
            <div class="emr-dialog__header">
              <h3 class="emr-dialog__title">Crop / Rotate {{ cItem.name }}</h3>
              <button
                #modalCancelCropBtn
                type="button"
                class="emr-button emr-button--ghost emr-button--small emr-image-viewer__tool-btn"
                (click)="closeModals()"
              >
                Cancel
              </button>
            </div>
            <div class="emr-dialog__body">
              <div class="emr-image-viewer">
                <div class="emr-image-viewer__toolbar">
                  <div class="emr-chip-row" role="radiogroup" aria-label="Aspect ratio presets">
                    @for (preset of resolvedAspectPresets(); track preset.id) {
                      <button
                        type="button"
                        role="radio"
                        class="emr-button emr-button--small emr-image-viewer__tool-btn"
                        [class.emr-button--primary]="cropDraft().aspectRatio === preset.ratio"
                        [class.emr-button--outline]="cropDraft().aspectRatio !== preset.ratio"
                        [attr.aria-checked]="cropDraft().aspectRatio === preset.ratio ? 'true' : 'false'"
                        (click)="setCropAspect(preset.ratio)"
                      >
                        {{ preset.label }}
                      </button>
                    }
                  </div>
                  <button
                    type="button"
                    class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
                    aria-label="Zoom out"
                    (click)="zoomCropDraft(-0.25)"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="7" />
                      <line x1="20" y1="20" x2="16.2" y2="16.2" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
                    aria-label="Zoom in"
                    (click)="zoomCropDraft(0.25)"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="7" />
                      <line x1="20" y1="20" x2="16.2" y2="16.2" />
                      <line x1="11" y1="8" x2="11" y2="14" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
                    aria-label="Rotate counterclockwise 90 degrees"
                    (click)="rotateCropDraft(false)"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
                    aria-label="Rotate clockwise 90 degrees"
                    (click)="rotateCropDraft(true)"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                  </button>
                  <label class="emr-image-viewer__straighten">
                    <span>Straighten</span>
                    <input
                      type="range"
                      min="-45"
                      max="45"
                      step="1"
                      [value]="cropStraightenOffset()"
                      aria-label="Straighten crop angle"
                      (input)="onCropStraightenInput($event)"
                    />
                  </label>
                  <button
                    type="button"
                    class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
                    [attr.aria-pressed]="cropDraft().flipH ? 'true' : 'false'"
                    (click)="toggleCropFlip('H')"
                  >
                    Flip H
                  </button>
                  <button
                    type="button"
                    class="emr-button emr-button--outline emr-button--small emr-image-viewer__tool-btn"
                    [attr.aria-pressed]="cropDraft().flipV ? 'true' : 'false'"
                    (click)="toggleCropFlip('V')"
                  >
                    Flip V
                  </button>
                </div>
                <div
                  #modalCropStage
                  class="emr-image-viewer__stage"
                  (pointerdown)="startModalCropDrag('pan', $event)"
                  (pointermove)="onModalCropPointerMove($event)"
                  (pointerup)="onModalCropPointerUp($event)"
                  (pointercancel)="onModalCropPointerUp($event)"
                >
                  <img
                    #modalCropImg
                    class="emr-image-viewer__img"
                    [src]="cItem.src"
                    [alt]="cItem.alt || cItem.name"
                    [style.transform]="cropDraftCss()"
                  />
                  <div
                    class="emr-image-cropper__box"
                    role="group"
                    tabindex="0"
                    aria-label="Crop region. Use arrow keys to move, Shift plus arrow keys to resize."
                    [style.left.%]="cropDraft().rect.x * 100"
                    [style.top.%]="cropDraft().rect.y * 100"
                    [style.width.%]="cropDraft().rect.width * 100"
                    [style.height.%]="cropDraft().rect.height * 100"
                    (pointerdown)="startModalCropDrag('move', $event)"
                    (keydown)="onModalCropBoxKeyDown($event)"
                  >
                    <div class="emr-image-cropper__grid" aria-hidden="true"></div>
                    <button
                      type="button"
                      class="emr-image-cropper__handle emr-image-cropper__handle--nw"
                      aria-label="Resize crop region top-left"
                      (pointerdown)="startModalCropDrag('nw', $event)"
                    ></button>
                    <button
                      type="button"
                      class="emr-image-cropper__handle emr-image-cropper__handle--ne"
                      aria-label="Resize crop region top-right"
                      (pointerdown)="startModalCropDrag('ne', $event)"
                    ></button>
                    <button
                      type="button"
                      class="emr-image-cropper__handle emr-image-cropper__handle--sw"
                      aria-label="Resize crop region bottom-left"
                      (pointerdown)="startModalCropDrag('sw', $event)"
                    ></button>
                    <button
                      type="button"
                      class="emr-image-cropper__handle emr-image-cropper__handle--se"
                      aria-label="Resize crop region bottom-right"
                      (pointerdown)="startModalCropDrag('se', $event)"
                    ></button>
                  </div>
                  <canvas #modalCropCanvas hidden aria-hidden="true"></canvas>
                </div>
              </div>
            </div>
            <div class="emr-dialog__footer">
              <button
                type="button"
                class="emr-button emr-button--ghost"
                (click)="resetCropDraft()"
              >
                Reset
              </button>
              <button
                type="button"
                class="emr-button emr-button--outline"
                (click)="closeModals()"
              >
                Cancel
              </button>
              <button
                type="button"
                class="emr-button emr-button--primary"
                (click)="commitModalCrop(cItem)"
              >
                Apply crop
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class EmrImageUploadComponent {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly labelHidden = input(false, { transform: booleanAttribute });
  readonly items = input<readonly EmrUploadedImageItem[]>([]);
  readonly accept = input('image/*');
  readonly multiple = input(true, { transform: booleanAttribute });
  readonly maxFiles = input<number | undefined>(undefined);
  readonly maxSizeBytes = input<number | undefined>(undefined);
  readonly allowCamera = input(false, { transform: booleanAttribute });
  readonly aspectPresets = input<readonly EmrAspectPreset[]>(DEFAULT_ASPECT_PRESETS);
  readonly buttonLabel = input('');
  readonly dropHint = input('Drag and drop clinical images here, or browse to preview and crop.');
  readonly emptyLabel = input('No images uploaded.');
  readonly cropOutputMimeType = input('image/png');
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly warning = input('');
  readonly info = input('');
  readonly error = input('');
  readonly messages = input<readonly EmrValidationMessage[]>([]);
  readonly invalid = input(false, { transform: booleanAttribute });

  readonly itemsChange = output<readonly EmrUploadedImageItem[]>();
  readonly filesSelected = output<readonly EmrFileSelectionItem[]>();
  readonly nativeFilesSelected = output<readonly File[]>();
  readonly imageCropped = output<{ readonly id: string; readonly result: EmrImageCropResult }>();
  readonly captionChange = output<{ readonly id: string; readonly caption: string }>();
  readonly removeRequested = output<string>();
  readonly captureRequested = output<'camera'>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  private readonly fallbackId = `emr-image-upload-${++nextImagePrimitiveId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly dragOver = signal(false);
  protected readonly internalError = signal('');
  protected readonly viewingIndex = signal<number | null>(null);
  protected readonly viewerState = signal<EmrImageViewportState>({ ...DEFAULT_IMAGE_VIEWPORT });
  protected readonly croppingItem = signal<EmrUploadedImageItem | null>(null);
  protected readonly cropDraft = signal<EmrImageCropTransform>({
    ...DEFAULT_IMAGE_CROP_TRANSFORM,
  });

  protected readonly viewingItem = computed<EmrUploadedImageItem | null>(() => {
    const idx = this.viewingIndex();
    if (idx === null) return null;
    return this.items()[idx] ?? null;
  });

  protected readonly resolvedAspectPresets = computed(() => {
    const p = this.aspectPresets();
    return p.length > 0 ? p : DEFAULT_ASPECT_PRESETS;
  });

  protected readonly resolvedButtonLabel = computed(() => {
    const custom = this.buttonLabel().trim();
    if (custom) return custom;
    return this.multiple() ? 'Choose images' : 'Choose image';
  });

  protected readonly isAtMaxLimit = computed(() => {
    const max = this.maxFiles();
    return max !== undefined && this.items().length >= max;
  });

  protected readonly capacityText = computed(() => {
    const max = this.maxFiles();
    if (max === undefined) return '';
    return this.isAtMaxLimit()
      ? `Maximum of ${max} images reached`
      : `${this.items().length} of ${max} uploaded`;
  });

  protected readonly maxSizeText = computed(() => {
    const maxBytes = this.maxSizeBytes();
    if (!maxBytes) return '';
    return `Max size: ${formatImageByteSize(maxBytes)}`;
  });

  protected readonly effectiveError = computed(() => this.error() || this.internalError());
  protected readonly hasWarning = computed(
    () => Boolean(this.warning()) || this.messages().some((m) => m.severity === 'warning'),
  );
  protected readonly isInvalid = computed(
    () =>
      this.invalid() ||
      Boolean(this.effectiveError()) ||
      this.messages().some((m) => m.severity === 'error'),
  );
  protected readonly hasAnyMessage = computed(() =>
    Boolean(
      this.hint() ||
        this.info() ||
        this.warning() ||
        this.effectiveError() ||
        this.messages().length > 0,
    ),
  );
  protected readonly describedBy = computed(() =>
    this.hasAnyMessage() ? `${this.resolvedId()}-message` : null,
  );

  protected readonly viewerZoomPercent = computed(() => Math.round(this.viewerState().zoom * 100));
  protected readonly viewerStraightenOffset = computed(
    () => splitRotationDegrees(this.viewerState().rotationDeg).straighten,
  );
  protected readonly viewerTransformCss = computed(() =>
    formatImageTransformCss(this.viewerState()),
  );
  protected readonly cropStraightenOffset = computed(
    () => splitRotationDegrees(this.cropDraft().rotationDeg).straighten,
  );
  protected readonly cropDraftCss = computed(() => {
    const d = this.cropDraft();
    return formatImageTransformCss({
      zoom: d.zoom,
      panX: d.panX,
      panY: d.panY,
      rotationDeg: d.rotationDeg,
      flipH: d.flipH,
      flipV: d.flipV,
    });
  });

  private readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private readonly cameraInputRef = viewChild<ElementRef<HTMLInputElement>>('cameraInput');
  private readonly modalCloseBtnRef = viewChild<ElementRef<HTMLButtonElement>>('modalCloseBtn');
  private readonly modalCancelCropBtnRef =
    viewChild<ElementRef<HTMLButtonElement>>('modalCancelCropBtn');
  private readonly modalCropStageRef = viewChild<ElementRef<HTMLElement>>('modalCropStage');
  private readonly modalCropImgRef = viewChild<ElementRef<HTMLImageElement>>('modalCropImg');
  private readonly modalCropCanvasRef = viewChild<ElementRef<HTMLCanvasElement>>('modalCropCanvas');

  private modalTriggerEl: HTMLElement | null = null;
  private viewerDragPointerId: number | null = null;
  private viewerDragOriginX = 0;
  private viewerDragOriginY = 0;
  private viewerStartPanX = 0;
  private viewerStartPanY = 0;

  private cropDragMode: CropDragMode | null = null;
  private cropDragPointerId: number | null = null;
  private cropDragOriginX = 0;
  private cropDragOriginY = 0;
  private cropStartRect: EmrImageCropRect = DEFAULT_IMAGE_CROP_TRANSFORM.rect;
  private cropStartPanX = 0;
  private cropStartPanY = 0;

  protected formatByteLabel(bytes?: number): string {
    return formatImageByteSize(bytes);
  }

  protected onEscapeKey(event: Event): void {
    if (this.viewingIndex() !== null || this.croppingItem()) {
      event.preventDefault();
      this.closeModals();
    }
  }

  protected openFileDialog(): void {
    if (this.disabled() || this.readOnly() || this.isAtMaxLimit()) return;
    this.fileInputRef()?.nativeElement.click();
  }

  protected openCameraCapture(): void {
    if (this.disabled() || this.readOnly() || this.isAtMaxLimit()) return;
    this.captureRequested.emit('camera');
    this.cameraInputRef()?.nativeElement.click();
  }

  protected onDragOver(event: DragEvent): void {
    if (this.disabled() || this.readOnly() || this.isAtMaxLimit()) return;
    event.preventDefault();
    this.dragOver.set(true);
  }

  protected onDrop(event: DragEvent): void {
    if (this.disabled() || this.readOnly() || this.isAtMaxLimit()) return;
    event.preventDefault();
    this.dragOver.set(false);
    const list = event.dataTransfer?.files;
    if (list && list.length > 0) {
      this.handleFileList(list);
    }
  }

  protected onFileChange(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    if (this.disabled() || this.readOnly() || this.isAtMaxLimit()) {
      inputEl.value = '';
      return;
    }
    if (inputEl.files && inputEl.files.length > 0) {
      this.handleFileList(inputEl.files);
      inputEl.value = '';
    }
  }

  protected onCaptionInput(id: string, event: Event): void {
    if (this.disabled() || this.readOnly()) return;
    const caption = (event.target as HTMLInputElement).value;
    this.captionChange.emit({ id, caption });
    this.itemsChange.emit(
      this.items().map((entry) => (entry.id === id ? { ...entry, caption } : entry)),
    );
  }

  protected openViewer(index: number, event?: Event): void {
    if (this.disabled()) return;
    this.modalTriggerEl = (event?.currentTarget as HTMLElement | null) ?? null;
    this.viewerState.set({ ...DEFAULT_IMAGE_VIEWPORT });
    this.viewingIndex.set(index);
    queueMicrotask(() => {
      this.modalCloseBtnRef()?.nativeElement?.focus();
    });
  }

  protected stepViewingIndex(delta: number): void {
    const total = this.items().length;
    const cur = this.viewingIndex();
    if (cur === null || total === 0) return;
    const bounded = (((cur + delta) % total) + total) % total;
    this.viewerState.set({ ...DEFAULT_IMAGE_VIEWPORT });
    this.viewingIndex.set(bounded);
  }

  protected onModalViewerKeyDown(event: KeyboardEvent): void {
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      this.viewerZoomBy(0.25);
    } else if (event.key === '-') {
      event.preventDefault();
      this.viewerZoomBy(-0.25);
    } else if (event.key === '0') {
      event.preventDefault();
      this.viewerReset();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.stepViewingIndex(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.stepViewingIndex(1);
    }
  }

  protected onViewerStageWheel(event: WheelEvent): void {
    event.preventDefault();
    this.viewerZoomBy(event.deltaY < 0 ? 0.15 : -0.15);
  }

  protected onViewerPointerDown(event: PointerEvent): void {
    const stage = event.currentTarget as HTMLElement;
    if (typeof stage.setPointerCapture === 'function') {
      stage.setPointerCapture(event.pointerId);
    }
    this.viewerDragPointerId = event.pointerId;
    this.viewerDragOriginX = event.clientX;
    this.viewerDragOriginY = event.clientY;
    const vp = this.viewerState();
    this.viewerStartPanX = vp.panX;
    this.viewerStartPanY = vp.panY;
  }

  protected onViewerPointerMove(event: PointerEvent): void {
    if (this.viewerDragPointerId !== event.pointerId) return;
    const dx = event.clientX - this.viewerDragOriginX;
    const dy = event.clientY - this.viewerDragOriginY;
    this.viewerState.set({
      ...this.viewerState(),
      panX: Math.round(this.viewerStartPanX + dx),
      panY: Math.round(this.viewerStartPanY + dy),
    });
  }

  protected onViewerPointerUp(event: PointerEvent): void {
    if (this.viewerDragPointerId !== event.pointerId) return;
    const stage = event.currentTarget as HTMLElement;
    if (typeof stage.releasePointerCapture === 'function') {
      stage.releasePointerCapture(event.pointerId);
    }
    this.viewerDragPointerId = null;
  }

  protected viewerZoomBy(delta: number): void {
    const cur = this.viewerState();
    this.viewerState.set({ ...cur, zoom: stepImageZoom(cur.zoom, delta) });
  }

  protected viewerReset(): void {
    this.viewerState.set({ ...DEFAULT_IMAGE_VIEWPORT });
  }

  protected viewerRotate90(clockwise: boolean): void {
    const cur = this.viewerState();
    const parts = splitRotationDegrees(cur.rotationDeg);
    const nextBase = rotateImage90(parts.base90, clockwise);
    this.viewerState.set({
      ...cur,
      rotationDeg: normalizeCombinedRotation(nextBase, parts.straighten),
    });
  }

  protected onViewerStraightenInput(event: Event): void {
    const deg = Number((event.target as HTMLInputElement).value);
    const clamped = Math.max(-45, Math.min(45, Number.isFinite(deg) ? deg : 0));
    const cur = this.viewerState();
    const parts = splitRotationDegrees(cur.rotationDeg);
    this.viewerState.set({
      ...cur,
      rotationDeg: normalizeCombinedRotation(parts.base90, clamped),
    });
  }

  protected viewerToggleFlip(axis: 'H' | 'V'): void {
    const cur = this.viewerState();
    this.viewerState.set({
      ...cur,
      flipH: axis === 'H' ? !cur.flipH : cur.flipH,
      flipV: axis === 'V' ? !cur.flipV : cur.flipV,
    });
  }

  protected openCropper(item: EmrUploadedImageItem, event?: Event): void {
    if (this.disabled() || this.readOnly()) return;
    this.modalTriggerEl = (event?.currentTarget as HTMLElement | null) ?? null;
    this.cropDraft.set(item.cropTransform ?? { ...DEFAULT_IMAGE_CROP_TRANSFORM });
    this.croppingItem.set(item);
    queueMicrotask(() => {
      this.modalCancelCropBtnRef()?.nativeElement?.focus();
    });
  }

  protected setCropAspect(ratio: number | null): void {
    const cur = this.cropDraft();
    this.cropDraft.set({
      ...cur,
      aspectRatio: ratio,
      rect: clampCropRect(cur.rect, ratio),
    });
  }

  protected zoomCropDraft(delta: number): void {
    const cur = this.cropDraft();
    this.cropDraft.set({ ...cur, zoom: stepImageZoom(cur.zoom, delta) });
  }

  protected rotateCropDraft(clockwise: boolean): void {
    const cur = this.cropDraft();
    const parts = splitRotationDegrees(cur.rotationDeg);
    const nextBase = rotateImage90(parts.base90, clockwise);
    this.cropDraft.set({
      ...cur,
      rotationDeg: normalizeCombinedRotation(nextBase, parts.straighten),
    });
  }

  protected onCropStraightenInput(event: Event): void {
    const deg = Number((event.target as HTMLInputElement).value);
    const clamped = Math.max(-45, Math.min(45, Number.isFinite(deg) ? deg : 0));
    const cur = this.cropDraft();
    const parts = splitRotationDegrees(cur.rotationDeg);
    this.cropDraft.set({
      ...cur,
      rotationDeg: normalizeCombinedRotation(parts.base90, clamped),
    });
  }

  protected toggleCropFlip(axis: 'H' | 'V'): void {
    const cur = this.cropDraft();
    this.cropDraft.set({
      ...cur,
      flipH: axis === 'H' ? !cur.flipH : cur.flipH,
      flipV: axis === 'V' ? !cur.flipV : cur.flipV,
    });
  }

  protected resetCropDraft(): void {
    this.cropDraft.set({ ...DEFAULT_IMAGE_CROP_TRANSFORM });
  }

  protected startModalCropDrag(mode: CropDragMode, event: PointerEvent): void {
    if (mode !== 'pan') {
      event.stopPropagation();
      event.preventDefault();
    }
    const stage = this.modalCropStageRef()?.nativeElement;
    if (stage && typeof stage.setPointerCapture === 'function') {
      stage.setPointerCapture(event.pointerId);
    }
    this.cropDragMode = mode;
    this.cropDragPointerId = event.pointerId;
    this.cropDragOriginX = event.clientX;
    this.cropDragOriginY = event.clientY;
    const d = this.cropDraft();
    this.cropStartRect = d.rect;
    this.cropStartPanX = d.panX;
    this.cropStartPanY = d.panY;
  }

  protected onModalCropPointerMove(event: PointerEvent): void {
    if (!this.cropDragMode || this.cropDragPointerId !== event.pointerId) return;
    const cur = this.cropDraft();
    if (this.cropDragMode === 'pan') {
      this.cropDraft.set({
        ...cur,
        panX: Math.round(this.cropStartPanX + (event.clientX - this.cropDragOriginX)),
        panY: Math.round(this.cropStartPanY + (event.clientY - this.cropDragOriginY)),
      });
      return;
    }
    const stage = this.modalCropStageRef()?.nativeElement;
    if (!stage) return;
    const bounds = stage.getBoundingClientRect();
    const widthPx = bounds.width > 0 ? bounds.width : 300;
    const heightPx = bounds.height > 0 ? bounds.height : 240;
    const dx = (event.clientX - this.cropDragOriginX) / widthPx;
    const dy = (event.clientY - this.cropDragOriginY) / heightPx;
    this.cropDraft.set({
      ...cur,
      rect: applyCropBoxDrag(this.cropDragMode, this.cropStartRect, dx, dy, cur.aspectRatio),
    });
  }

  protected onModalCropPointerUp(event: PointerEvent): void {
    if (this.cropDragPointerId !== event.pointerId) return;
    const stage = this.modalCropStageRef()?.nativeElement;
    if (stage && typeof stage.releasePointerCapture === 'function') {
      stage.releasePointerCapture(event.pointerId);
    }
    this.cropDragMode = null;
    this.cropDragPointerId = null;
  }

  protected onModalCropBoxKeyDown(event: KeyboardEvent): void {
    const cur = this.cropDraft();
    const step = event.shiftKey ? 0.05 : 0.02;
    let nextRect: EmrImageCropRect | null = null;
    if (event.shiftKey) {
      if (event.key === 'ArrowRight') {
        nextRect = computeAspectLockedCropRect(
          cur.rect,
          { ...cur.rect, width: cur.rect.width + step },
          cur.aspectRatio,
        );
      } else if (event.key === 'ArrowLeft') {
        nextRect = computeAspectLockedCropRect(
          cur.rect,
          { ...cur.rect, width: cur.rect.width - step },
          cur.aspectRatio,
        );
      } else if (event.key === 'ArrowDown') {
        nextRect = computeAspectLockedCropRect(
          cur.rect,
          { ...cur.rect, height: cur.rect.height + step },
          cur.aspectRatio,
        );
      } else if (event.key === 'ArrowUp') {
        nextRect = computeAspectLockedCropRect(
          cur.rect,
          { ...cur.rect, height: cur.rect.height - step },
          cur.aspectRatio,
        );
      }
    } else {
      if (event.key === 'ArrowRight') {
        nextRect = clampCropRect({ ...cur.rect, x: cur.rect.x + step }, cur.aspectRatio);
      } else if (event.key === 'ArrowLeft') {
        nextRect = clampCropRect({ ...cur.rect, x: cur.rect.x - step }, cur.aspectRatio);
      } else if (event.key === 'ArrowDown') {
        nextRect = clampCropRect({ ...cur.rect, y: cur.rect.y + step }, cur.aspectRatio);
      } else if (event.key === 'ArrowUp') {
        nextRect = clampCropRect({ ...cur.rect, y: cur.rect.y - step }, cur.aspectRatio);
      }
    }
    if (nextRect) {
      event.preventDefault();
      this.cropDraft.set({ ...cur, rect: nextRect });
    }
  }

  protected commitModalCrop(item: EmrUploadedImageItem): void {
    if (this.disabled() || this.readOnly()) return;
    const transform = this.cropDraft();
    const croppedDataUrl = rasterizeCanvasCrop(
      this.modalCropImgRef()?.nativeElement,
      this.modalCropCanvasRef()?.nativeElement,
      transform,
      this.cropOutputMimeType(),
      item.previewSrc ?? item.src,
    );
    const result: EmrImageCropResult = {
      transform,
      croppedDataUrl,
    };
    const nextItems = this.items().map((existing) =>
      existing.id === item.id
        ? {
            ...existing,
            cropTransform: transform,
            previewSrc: result.croppedDataUrl ?? existing.src,
          }
        : existing,
    );
    this.imageCropped.emit({ id: item.id, result });
    this.itemsChange.emit(nextItems);
    this.closeModals();
  }

  protected removeItem(id: string): void {
    if (this.disabled() || this.readOnly()) return;
    this.removeRequested.emit(id);
    this.itemsChange.emit(this.items().filter((item) => item.id !== id));
  }

  protected closeModals(): void {
    this.viewingIndex.set(null);
    this.croppingItem.set(null);
    const trigger = this.modalTriggerEl;
    this.modalTriggerEl = null;
    if (trigger) {
      queueMicrotask(() => trigger.focus());
    }
  }

  private handleFileList(fileList: FileList): void {
    const maxBytes = this.maxSizeBytes();
    const accept = this.accept();
    const maxCount = this.maxFiles();
    const current = this.items();
    const remaining = maxCount !== undefined ? Math.max(0, maxCount - current.length) : Infinity;

    const validFiles: File[] = [];
    const errors: string[] = [];
    for (const file of Array.from(fileList)) {
      const validationMsg = validateUploadedImageFile(
        { name: file.name, sizeBytes: file.size, mimeType: file.type },
        { accept, maxSizeBytes: maxBytes },
      );
      if (validationMsg) {
        errors.push(validationMsg);
      } else {
        validFiles.push(file);
      }
    }

    this.internalError.set(errors[0] ?? '');
    const rawFiles = validFiles.slice(0, this.multiple() ? remaining : 1);
    if (rawFiles.length === 0) return;

    const metadata: EmrFileSelectionItem[] = rawFiles.map((file) => ({
      name: file.name,
      sizeBytes: file.size,
      mimeType: file.type || 'image/jpeg',
      lastModified: file.lastModified,
    }));

    const baseItems: EmrUploadedImageItem[] = rawFiles.map((file, idx) => {
      const placeholder = `data:${file.type || 'image/png'};base64,`;
      return {
        id: `${this.resolvedId()}-img-${current.length + idx + 1}-${Date.now()}`,
        name: file.name,
        src: placeholder,
        previewSrc: placeholder,
        mimeType: file.type || 'image/jpeg',
        sizeBytes: file.size,
        alt: file.name,
      };
    });

    this.nativeFilesSelected.emit(rawFiles);
    this.filesSelected.emit(metadata);
    const initialList = this.multiple() ? [...current, ...baseItems] : baseItems;
    this.itemsChange.emit(initialList);

    if (typeof FileReader !== 'undefined') {
      let latestList = initialList;
      rawFiles.forEach((file, idx) => {
        const targetId = baseItems[idx]?.id;
        if (!targetId) return;
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = typeof reader.result === 'string' ? reader.result : null;
          if (!dataUrl) return;
          const base = this.items().some((entry) => entry.id === targetId)
            ? this.items()
            : latestList;
          latestList = base.map((entry) =>
            entry.id === targetId ? { ...entry, src: dataUrl, previewSrc: dataUrl } : entry,
          );
          this.itemsChange.emit(latestList);
        };
        reader.readAsDataURL(file);
      });
    }
  }
}
