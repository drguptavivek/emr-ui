import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  booleanAttribute,
  computed,
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
} from '@drguptavivek/emr-controller';
import {
  DEFAULT_ASPECT_PRESETS,
  DEFAULT_IMAGE_CROP_TRANSFORM,
  DEFAULT_IMAGE_VIEWPORT,
  clampCropRect,
  clampStraightenAngle,
  formatImageTransformCss,
  rotateImage90,
  stepImageZoom,
} from './emr-wave2.logic';

let nextImagePrimitiveId = 0;

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
      [id]="resolvedId()"
      role="region"
      [attr.aria-label]="label() || activeImage()?.alt || 'Clinical image viewer'"
    >
      <div class="emr-image-viewer__toolbar">
        @if (label()) {
          <strong class="emr-field__label">{{ label() }}</strong>
        }
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small"
          [disabled]="disabled()"
          aria-label="Zoom out"
          (click)="zoomBy(-0.25)"
        >
          −
        </button>
        <span class="emr-badge emr-tone-neutral">{{ zoomPercent() }}%</span>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small"
          [disabled]="disabled()"
          aria-label="Zoom in"
          (click)="zoomBy(0.25)"
        >
          +
        </button>
        <button
          type="button"
          class="emr-button emr-button--ghost emr-button--small"
          [disabled]="disabled()"
          (click)="resetViewport()"
        >
          Fit
        </button>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small"
          [disabled]="disabled()"
          aria-label="Rotate counterclockwise 90 degrees"
          (click)="rotate90(false)"
        >
          ↺ -90°
        </button>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small"
          [disabled]="disabled()"
          aria-label="Rotate clockwise 90 degrees"
          (click)="rotate90(true)"
        >
          ↻ +90°
        </button>
        <label class="emr-field__hint">
          Straighten
          <input
            type="range"
            min="-45"
            max="45"
            step="1"
            [value]="straightenOffset()"
            [disabled]="disabled()"
            aria-label="Straighten angle"
            (input)="onStraightenInput($event)"
          />
        </label>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small"
          [disabled]="disabled()"
          [attr.aria-pressed]="viewport().flipH"
          aria-label="Flip horizontal"
          (click)="toggleFlip('H')"
        >
          ⇄ Flip H
        </button>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small"
          [disabled]="disabled()"
          [attr.aria-pressed]="viewport().flipV"
          aria-label="Flip vertical"
          (click)="toggleFlip('V')"
        >
          ⇅ Flip V
        </button>
        @if (allowFullscreen()) {
          <button
            type="button"
            class="emr-button emr-button--secondary emr-button--small"
            [disabled]="disabled()"
            (click)="toggleFullscreen()"
          >
            {{ isFullscreen() ? 'Exit fullscreen' : 'Fullscreen' }}
          </button>
        }
      </div>

      <div
        class="emr-image-viewer__stage"
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
        <div class="emr-choice-header">
          @if (activeImage()?.caption; as cap) {
            <span class="emr-field__hint">{{ cap }}</span>
          }
          @if (resolvedImages().length > 1) {
            <div class="emr-chip-row">
              @for (item of resolvedImages(); track item.id; let idx = $index) {
                <button
                  type="button"
                  class="emr-button emr-button--small"
                  [class.emr-button--primary]="idx === currentIndex()"
                  [class.emr-button--outline]="idx !== currentIndex()"
                  [disabled]="disabled()"
                  (click)="selectImageIndex(idx)"
                >
                  {{ idx + 1 }}. {{ item.alt || item.id }}
                </button>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class EmrImageViewerComponent {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly src = input<string | null>(null);
  readonly alt = input('Clinical image');
  readonly caption = input<string>();
  readonly images = input<readonly EmrImageItem[]>([]);
  readonly activeIndex = input<number | undefined>(undefined);
  readonly fullscreen = input<boolean | undefined>(undefined);
  readonly allowFullscreen = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly activeIndexChange = output<number>();
  readonly fullscreenChange = output<boolean>();
  readonly viewportChange = output<EmrImageViewportState>();

  private readonly fallbackId = `emr-image-viewer-${++nextImagePrimitiveId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly localIndex = signal(0);
  protected readonly localFullscreen = signal(false);
  protected readonly viewport = signal<EmrImageViewportState>({ ...DEFAULT_IMAGE_VIEWPORT });
  protected readonly baseQuarterRotation = signal(0);
  protected readonly straightenOffset = signal(0);

  private activePointerId: number | null = null;
  private dragOriginX = 0;
  private dragOriginY = 0;
  private startPanX = 0;
  private startPanY = 0;

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

  protected readonly isFullscreen = computed(() => {
    const controlled = this.fullscreen();
    return controlled !== undefined ? controlled : this.localFullscreen();
  });

  protected readonly zoomPercent = computed(() => Math.round(this.viewport().zoom * 100));
  protected readonly transformCss = computed(() => formatImageTransformCss(this.viewport()));

  protected onEscapeKey(event: Event): void {
    if (this.isFullscreen()) {
      event.preventDefault();
      this.setFullscreen(false);
    }
  }

  protected zoomBy(delta: number): void {
    if (this.disabled()) return;
    this.updateViewport({
      ...this.viewport(),
      zoom: stepImageZoom(this.viewport().zoom, delta),
    });
  }

  protected rotate90(clockwise: boolean): void {
    if (this.disabled()) return;
    const nextBase = rotateImage90(this.baseQuarterRotation(), clockwise);
    this.baseQuarterRotation.set(nextBase);
    this.updateViewport({
      ...this.viewport(),
      rotationDeg: clampStraightenAngle(nextBase + this.straightenOffset()),
    });
  }

  protected onStraightenInput(event: Event): void {
    if (this.disabled()) return;
    const deg = Number((event.target as HTMLInputElement).value);
    const clamped = Math.max(-45, Math.min(45, Number.isFinite(deg) ? deg : 0));
    this.straightenOffset.set(clamped);
    this.updateViewport({
      ...this.viewport(),
      rotationDeg: clampStraightenAngle(this.baseQuarterRotation() + clamped),
    });
  }

  protected toggleFlip(axis: 'H' | 'V'): void {
    if (this.disabled()) return;
    const cur = this.viewport();
    this.updateViewport({
      ...cur,
      flipH: axis === 'H' ? !cur.flipH : cur.flipH,
      flipV: axis === 'V' ? !cur.flipV : cur.flipV,
    });
  }

  protected resetViewport(): void {
    if (this.disabled()) return;
    this.baseQuarterRotation.set(0);
    this.straightenOffset.set(0);
    this.updateViewport({ ...DEFAULT_IMAGE_VIEWPORT });
  }

  protected toggleFullscreen(): void {
    if (this.disabled()) return;
    this.setFullscreen(!this.isFullscreen());
  }

  protected selectImageIndex(index: number): void {
    if (this.disabled()) return;
    this.localIndex.set(index);
    this.resetViewport();
    this.activeIndexChange.emit(index);
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
    this.startPanX = this.viewport().panX;
    this.startPanY = this.viewport().panY;
  }

  protected onStagePointerMove(event: PointerEvent): void {
    if (this.disabled() || this.activePointerId !== event.pointerId) return;
    const dx = event.clientX - this.dragOriginX;
    const dy = event.clientY - this.dragOriginY;
    this.updateViewport({
      ...this.viewport(),
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
    this.localFullscreen.set(next);
    this.fullscreenChange.emit(next);
  }

  private updateViewport(next: EmrImageViewportState): void {
    this.viewport.set(next);
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
      [id]="resolvedId()"
      role="region"
      [attr.aria-label]="label() || 'Image cropper'"
    >
      <div class="emr-image-viewer__toolbar">
        @for (preset of aspectPresets(); track preset.id) {
          <button
            type="button"
            class="emr-button emr-button--small"
            [class.emr-button--primary]="currentTransform().aspectRatio === preset.ratio"
            [class.emr-button--outline]="currentTransform().aspectRatio !== preset.ratio"
            [disabled]="disabled() || readOnly()"
            (click)="selectAspectPreset(preset)"
          >
            {{ preset.label }}
          </button>
        }
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small"
          [disabled]="disabled() || readOnly()"
          aria-label="Zoom out"
          (click)="zoomBy(-0.25)"
        >
          −
        </button>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small"
          [disabled]="disabled() || readOnly()"
          aria-label="Zoom in"
          (click)="zoomBy(0.25)"
        >
          +
        </button>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small"
          [disabled]="disabled() || readOnly()"
          aria-label="Rotate counterclockwise 90 degrees"
          (click)="rotate90(false)"
        >
          ↺ -90°
        </button>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small"
          [disabled]="disabled() || readOnly()"
          aria-label="Rotate clockwise 90 degrees"
          (click)="rotate90(true)"
        >
          ↻ +90°
        </button>
        <label class="emr-field__hint">
          Straighten
          <input
            type="range"
            min="-45"
            max="45"
            step="1"
            [value]="straightenOffset()"
            [disabled]="disabled() || readOnly()"
            aria-label="Straighten crop angle"
            (input)="onStraightenInput($event)"
          />
        </label>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small"
          [disabled]="disabled() || readOnly()"
          [attr.aria-pressed]="currentTransform().flipH"
          (click)="toggleFlip('H')"
        >
          ⇄ Flip H
        </button>
        <button
          type="button"
          class="emr-button emr-button--outline emr-button--small"
          [disabled]="disabled() || readOnly()"
          [attr.aria-pressed]="currentTransform().flipV"
          (click)="toggleFlip('V')"
        >
          ⇅ Flip V
        </button>
      </div>

      <div
        #stageEl
        class="emr-image-viewer__stage"
        (pointermove)="onStagePointerMove($event)"
        (pointerup)="onStagePointerUp($event)"
        (pointercancel)="onStagePointerUp($event)"
      >
        @if (src()) {
          <img
            class="emr-image-viewer__img"
            [src]="src()!"
            [alt]="alt()"
            [style.transform]="imageTransformCss()"
          />
          <div
            class="emr-image-cropper__box"
            role="group"
            aria-label="Crop region"
            [style.left.%]="currentTransform().rect.x * 100"
            [style.top.%]="currentTransform().rect.y * 100"
            [style.width.%]="currentTransform().rect.width * 100"
            [style.height.%]="currentTransform().rect.height * 100"
            (pointerdown)="startCropDrag('move', $event)"
          >
            <span
              class="emr-image-cropper__handle"
              style="right: -10px; bottom: -10px; cursor: nwse-resize"
              aria-label="Resize crop region"
              (pointerdown)="startCropDrag('resize', $event)"
            ></span>
          </div>
        } @else {
          <div class="emr-empty">No image loaded for cropping</div>
        }
      </div>

      <div class="emr-choice-header">
        <button
          type="button"
          class="emr-button emr-button--ghost emr-button--small"
          [disabled]="disabled() || readOnly()"
          (click)="resetCrop()"
        >
          Reset
        </button>
        <div class="emr-chip-row">
          <button
            type="button"
            class="emr-button emr-button--outline emr-button--small"
            [disabled]="disabled()"
            (click)="cancelRequested.emit()"
          >
            Cancel
          </button>
          <button
            type="button"
            class="emr-button emr-button--primary emr-button--small"
            [disabled]="disabled() || readOnly() || !src()"
            (click)="applyCrop()"
          >
            Apply crop
          </button>
        </div>
      </div>
    </div>
  `,
})
export class EmrImageCropperComponent {
  readonly controlId = input<string>();
  readonly label = input('');
  readonly src = input<string | null>(null);
  readonly alt = input('Image to crop');
  readonly aspectPresets = input<readonly EmrAspectPreset[]>(DEFAULT_ASPECT_PRESETS);
  readonly initialTransform = input<EmrImageCropTransform | undefined>(undefined);
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });

  readonly cropChange = output<EmrImageCropTransform>();
  readonly cropCommitted = output<EmrImageCropResult>();
  readonly cancelRequested = output<void>();

  private readonly fallbackId = `emr-image-cropper-${++nextImagePrimitiveId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly draftTransform = signal<EmrImageCropTransform | null>(null);
  protected readonly baseQuarterRotation = signal(0);
  protected readonly straightenOffset = signal(0);

  private readonly stageRef = viewChild<ElementRef<HTMLElement>>('stageEl');
  private dragMode: 'move' | 'resize' | null = null;
  private activePointerId: number | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private startRect: EmrImageCropRect = DEFAULT_IMAGE_CROP_TRANSFORM.rect;

  protected readonly currentTransform = computed<EmrImageCropTransform>(
    () => this.draftTransform() ?? this.initialTransform() ?? DEFAULT_IMAGE_CROP_TRANSFORM,
  );

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

  protected selectAspectPreset(preset: EmrAspectPreset): void {
    if (this.disabled() || this.readOnly()) return;
    const cur = this.currentTransform();
    const nextRect = clampCropRect(cur.rect, preset.ratio);
    this.emitTransform({
      ...cur,
      aspectRatio: preset.ratio,
      rect: nextRect,
    });
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
    const nextBase = rotateImage90(this.baseQuarterRotation(), clockwise);
    this.baseQuarterRotation.set(nextBase);
    const cur = this.currentTransform();
    this.emitTransform({
      ...cur,
      rotationDeg: clampStraightenAngle(nextBase + this.straightenOffset()),
    });
  }

  protected onStraightenInput(event: Event): void {
    if (this.disabled() || this.readOnly()) return;
    const deg = Number((event.target as HTMLInputElement).value);
    const clamped = Math.max(-45, Math.min(45, Number.isFinite(deg) ? deg : 0));
    this.straightenOffset.set(clamped);
    const cur = this.currentTransform();
    this.emitTransform({
      ...cur,
      rotationDeg: clampStraightenAngle(this.baseQuarterRotation() + clamped),
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

  protected resetCrop(): void {
    if (this.disabled() || this.readOnly()) return;
    this.baseQuarterRotation.set(0);
    this.straightenOffset.set(0);
    this.emitTransform({ ...DEFAULT_IMAGE_CROP_TRANSFORM });
  }

  protected applyCrop(): void {
    if (this.disabled() || this.readOnly() || !this.src()) return;
    const transform = this.currentTransform();
    this.cropCommitted.emit({
      transform,
      croppedDataUrl: this.src(),
    });
  }

  protected startCropDrag(mode: 'move' | 'resize', event: PointerEvent): void {
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
    const stage = this.stageRef()?.nativeElement;
    if (!stage) return;
    const bounds = stage.getBoundingClientRect();
    const widthPx = bounds.width > 0 ? bounds.width : 300;
    const heightPx = bounds.height > 0 ? bounds.height : 240;
    const dx = (event.clientX - this.dragStartX) / widthPx;
    const dy = (event.clientY - this.dragStartY) / heightPx;
    const cur = this.currentTransform();
    const nextRect =
      this.dragMode === 'move'
        ? clampCropRect(
            {
              x: this.startRect.x + dx,
              y: this.startRect.y + dy,
              width: this.startRect.width,
              height: this.startRect.height,
            },
            cur.aspectRatio,
          )
        : clampCropRect(
            {
              x: this.startRect.x,
              y: this.startRect.y,
              width: this.startRect.width + dx,
              height: this.startRect.height + dy,
            },
            cur.aspectRatio,
          );
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
    <div class="emr-field" [id]="resolvedId()">
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
          [attr.data-dragover]="dragOver() || null"
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
            [disabled]="disabled()"
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
              [disabled]="disabled()"
              (change)="onFileChange($event)"
            />
          }
          <div class="emr-chip-row">
            <button
              type="button"
              class="emr-button emr-button--outline"
              [disabled]="disabled() || isAtMaxLimit()"
              (click)="openFileDialog()"
            >
              Choose image{{ multiple() ? 's' : '' }}
            </button>
            @if (allowCamera()) {
              <button
                type="button"
                class="emr-button emr-button--secondary"
                [disabled]="disabled() || isAtMaxLimit()"
                (click)="openCameraCapture()"
              >
                Take photo
              </button>
            }
          </div>
          <span class="emr-field__hint">
            Drag and drop clinical images here, or browse to preview and crop before saving.
          </span>
        </div>
      }

      @if (items().length > 0) {
        <div class="emr-image-upload__grid" role="list" aria-label="Uploaded images">
          @for (item of items(); track item.id) {
            <div class="emr-image-upload__card" role="listitem">
              <img
                class="emr-image-upload__thumb"
                [src]="item.previewSrc || item.src"
                [alt]="item.alt || item.name"
              />
              <div>
                <div class="emr-image-upload__actions">
                  <strong class="emr-field__hint">{{ item.name }}</strong>
                  <div class="emr-chip-row">
                    <button
                      type="button"
                      class="emr-button emr-button--ghost emr-button--small"
                      [disabled]="disabled()"
                      [attr.aria-label]="'View ' + item.name"
                      (click)="openViewer(item)"
                    >
                      View
                    </button>
                    @if (!readOnly()) {
                      <button
                        type="button"
                        class="emr-button emr-button--outline emr-button--small"
                        [disabled]="disabled()"
                        [attr.aria-label]="'Crop or rotate ' + item.name"
                        (click)="openCropper(item)"
                      >
                        Crop / Rotate
                      </button>
                      <button
                        type="button"
                        class="emr-button emr-button--ghost emr-button--small"
                        [disabled]="disabled()"
                        [attr.aria-label]="'Remove ' + item.name"
                        (click)="removeItem(item.id)"
                      >
                        Remove
                      </button>
                    }
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }

      @if (!labelHidden() && hint()) {
        <span class="emr-field__hint" [id]="resolvedId() + '-hint'">{{ hint() }}</span>
      }
      @if (!labelHidden() && error()) {
        <span class="emr-field__error" [id]="resolvedId() + '-error'">{{ error() }}</span>
      }

      @if (viewingItem(); as vItem) {
        <div class="emr-dialog-backdrop" role="dialog" aria-modal="true" [attr.aria-label]="'Viewing ' + vItem.name">
          <div class="emr-dialog emr-dialog--lg">
            <div class="emr-dialog__header">
              <h3 class="emr-dialog__title">{{ vItem.name }}</h3>
              <button
                type="button"
                class="emr-button emr-button--ghost emr-button--small"
                (click)="closeModals()"
              >
                Close
              </button>
            </div>
            <div class="emr-dialog__body">
              <div class="emr-image-viewer">
                <div class="emr-image-viewer__toolbar">
                  <button
                    type="button"
                    class="emr-button emr-button--outline emr-button--small"
                    (click)="viewerZoomBy(-0.25)"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    class="emr-button emr-button--outline emr-button--small"
                    (click)="viewerZoomBy(0.25)"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    class="emr-button emr-button--outline emr-button--small"
                    (click)="viewerRotate90(false)"
                  >
                    ↺ -90°
                  </button>
                  <button
                    type="button"
                    class="emr-button emr-button--outline emr-button--small"
                    (click)="viewerRotate90(true)"
                  >
                    ↻ +90°
                  </button>
                </div>
                <div class="emr-image-viewer__stage">
                  <img
                    class="emr-image-viewer__img"
                    [src]="vItem.previewSrc || vItem.src"
                    [alt]="vItem.alt || vItem.name"
                    [style.transform]="viewerTransformCss()"
                  />
                </div>
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
                type="button"
                class="emr-button emr-button--ghost emr-button--small"
                (click)="closeModals()"
              >
                Cancel
              </button>
            </div>
            <div class="emr-dialog__body">
              <div class="emr-image-viewer">
                <div class="emr-image-viewer__toolbar">
                  @for (preset of aspectPresets(); track preset.id) {
                    <button
                      type="button"
                      class="emr-button emr-button--small"
                      [class.emr-button--primary]="cropDraft().aspectRatio === preset.ratio"
                      [class.emr-button--outline]="cropDraft().aspectRatio !== preset.ratio"
                      (click)="setCropAspect(preset.ratio)"
                    >
                      {{ preset.label }}
                    </button>
                  }
                  <button
                    type="button"
                    class="emr-button emr-button--outline emr-button--small"
                    (click)="rotateCropDraft(false)"
                  >
                    ↺ -90°
                  </button>
                  <button
                    type="button"
                    class="emr-button emr-button--outline emr-button--small"
                    (click)="rotateCropDraft(true)"
                  >
                    ↻ +90°
                  </button>
                </div>
                <div class="emr-image-viewer__stage">
                  <img
                    class="emr-image-viewer__img"
                    [src]="cItem.src"
                    [alt]="cItem.alt || cItem.name"
                    [style.transform]="cropDraftCss()"
                  />
                  <div
                    class="emr-image-cropper__box"
                    [style.left.%]="cropDraft().rect.x * 100"
                    [style.top.%]="cropDraft().rect.y * 100"
                    [style.width.%]="cropDraft().rect.width * 100"
                    [style.height.%]="cropDraft().rect.height * 100"
                  ></div>
                </div>
              </div>
            </div>
            <div class="emr-dialog__footer">
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
  readonly required = input(false, { transform: booleanAttribute });
  readonly readOnly = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly error = input('');

  readonly itemsChange = output<readonly EmrUploadedImageItem[]>();
  readonly filesSelected = output<readonly EmrFileSelectionItem[]>();
  readonly nativeFilesSelected = output<readonly File[]>();
  readonly imageCropped = output<{ readonly id: string; readonly result: EmrImageCropResult }>();
  readonly removeRequested = output<string>();
  readonly captureRequested = output<'camera'>();

  private readonly fallbackId = `emr-image-upload-${++nextImagePrimitiveId}`;
  readonly resolvedId = computed(() => this.controlId() || this.fallbackId);

  protected readonly dragOver = signal(false);
  protected readonly viewingItem = signal<EmrUploadedImageItem | null>(null);
  protected readonly viewerState = signal<EmrImageViewportState>({ ...DEFAULT_IMAGE_VIEWPORT });
  protected readonly croppingItem = signal<EmrUploadedImageItem | null>(null);
  protected readonly cropDraft = signal<EmrImageCropTransform>({
    ...DEFAULT_IMAGE_CROP_TRANSFORM,
  });

  protected readonly isAtMaxLimit = computed(() => {
    const max = this.maxFiles();
    return max !== undefined && this.items().length >= max;
  });

  protected readonly viewerTransformCss = computed(() =>
    formatImageTransformCss(this.viewerState()),
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

  protected onEscapeKey(event: Event): void {
    if (this.viewingItem() || this.croppingItem()) {
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
    if (this.disabled() || this.readOnly()) return;
    event.preventDefault();
    this.dragOver.set(true);
  }

  protected onDrop(event: DragEvent): void {
    if (this.disabled() || this.readOnly()) return;
    event.preventDefault();
    this.dragOver.set(false);
    const list = event.dataTransfer?.files;
    if (list && list.length > 0) {
      this.handleFileList(list);
    }
  }

  protected onFileChange(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    if (this.disabled() || this.readOnly()) {
      inputEl.value = '';
      return;
    }
    if (inputEl.files && inputEl.files.length > 0) {
      this.handleFileList(inputEl.files);
      inputEl.value = '';
    }
  }

  protected openViewer(item: EmrUploadedImageItem): void {
    if (this.disabled()) return;
    this.viewerState.set({ ...DEFAULT_IMAGE_VIEWPORT });
    this.viewingItem.set(item);
  }

  protected viewerZoomBy(delta: number): void {
    const cur = this.viewerState();
    this.viewerState.set({ ...cur, zoom: stepImageZoom(cur.zoom, delta) });
  }

  protected viewerRotate90(clockwise: boolean): void {
    const cur = this.viewerState();
    this.viewerState.set({ ...cur, rotationDeg: rotateImage90(cur.rotationDeg, clockwise) });
  }

  protected openCropper(item: EmrUploadedImageItem): void {
    if (this.disabled() || this.readOnly()) return;
    this.cropDraft.set(item.cropTransform ?? { ...DEFAULT_IMAGE_CROP_TRANSFORM });
    this.croppingItem.set(item);
  }

  protected setCropAspect(ratio: number | null): void {
    const cur = this.cropDraft();
    this.cropDraft.set({
      ...cur,
      aspectRatio: ratio,
      rect: clampCropRect(cur.rect, ratio),
    });
  }

  protected rotateCropDraft(clockwise: boolean): void {
    const cur = this.cropDraft();
    this.cropDraft.set({
      ...cur,
      rotationDeg: rotateImage90(cur.rotationDeg, clockwise),
    });
  }

  protected commitModalCrop(item: EmrUploadedImageItem): void {
    if (this.disabled() || this.readOnly()) return;
    const transform = this.cropDraft();
    const result: EmrImageCropResult = {
      transform,
      croppedDataUrl: item.previewSrc ?? item.src,
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
    this.viewingItem.set(null);
    this.croppingItem.set(null);
  }

  private handleFileList(fileList: FileList): void {
    const maxBytes = this.maxSizeBytes();
    const maxCount = this.maxFiles();
    const current = this.items();
    const remaining = maxCount !== undefined ? Math.max(0, maxCount - current.length) : Infinity;

    const rawFiles = Array.from(fileList)
      .filter((f) => (maxBytes !== undefined ? f.size <= maxBytes : true))
      .slice(0, this.multiple() ? remaining : 1);

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
        id: `${this.resolvedId()}-img-${current.length + idx + 1}`,
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
      rawFiles.forEach((file, idx) => {
        const targetId = baseItems[idx]?.id;
        if (!targetId) return;
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = typeof reader.result === 'string' ? reader.result : null;
          if (!dataUrl) return;
          const latest = this.items().length > 0 ? this.items() : initialList;
          this.itemsChange.emit(
            latest.map((entry) =>
              entry.id === targetId ? { ...entry, src: dataUrl, previewSrc: dataUrl } : entry,
            ),
          );
        };
        reader.readAsDataURL(file);
      });
    }
  }
}
