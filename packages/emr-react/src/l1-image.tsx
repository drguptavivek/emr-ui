'use client';

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
import { createElement, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SvgIcon } from './icons';
import { FieldChrome, type FieldValidationLine } from './l1-field-chrome';
import {
  clampCropRect,
  clampStraightenAngle,
  computeAspectLockedCropRect,
  computeCroppedCanvasPlan,
  DEFAULT_ASPECT_PRESETS,
  DEFAULT_IMAGE_CROP_TRANSFORM,
  DEFAULT_IMAGE_VIEWPORT,
  formatImageTransformCss,
  formatL1ByteSize,
  rotateImage90,
  splitRotationDegrees,
  stepImageZoom,
  themeColorWithAlpha,
  validateUploadedImageFile,
} from './l1-wave2.logic';
import { EmrBadgeView, EmrButton } from './primitives';
import { fontFamily, fontWeight, useEmrTheme } from './theme';

export type {
  EmrAspectPreset,
  EmrImageCropRect,
  EmrImageCropResult,
  EmrImageCropTransform,
  EmrImageItem,
  EmrImageViewportState,
  EmrUploadedImageItem,
};

type ReactCropDragMode = 'move' | 'pan' | 'nw' | 'ne' | 'sw' | 'se';

function normalizeCombinedRotation(base90: number, straighten: number): number {
  const raw = base90 + straighten;
  if (raw === 180) return 180;
  let norm = ((raw % 360) + 360) % 360;
  if (norm > 180) norm -= 360;
  return Math.round(norm * 10) / 10;
}

function applyReactCropDrag(
  mode: ReactCropDragMode,
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

function rasterizeWebCanvasCrop(
  imgEl: HTMLImageElement | null,
  canvasEl: HTMLCanvasElement | null,
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

// ─────────────────────────────────────────────────────────────
// 1. EmrImageViewer
// ─────────────────────────────────────────────────────────────

export interface EmrImageViewerProps {
  readonly src?: string;
  readonly alt?: string;
  readonly caption?: string;
  readonly images?: readonly EmrImageItem[];
  readonly activeIndex?: number;
  readonly onActiveIndexChange?: (index: number) => void;
  readonly viewport?: EmrImageViewportState;
  readonly onViewportChange?: (viewport: EmrImageViewportState) => void;
  readonly fullscreen?: boolean;
  readonly allowFullscreen?: boolean;
  readonly showThumbnails?: boolean;
  readonly onFullscreenChange?: (fullscreen: boolean) => void;
  readonly onCloseRequested?: () => void;
  readonly height?: number;
  readonly label?: string;
  readonly labelHidden?: boolean;
  readonly hint?: string;
  readonly warning?: string;
  readonly error?: string;
  readonly invalid?: boolean;
  readonly readOnly?: boolean;
  readonly disabled?: boolean;
  readonly controlId?: string;
  readonly onFocus?: () => void;
  readonly onBlur?: () => void;
}

export function EmrImageViewer({
  src,
  alt = 'Clinical image',
  caption,
  images,
  activeIndex,
  onActiveIndexChange,
  viewport,
  onViewportChange,
  fullscreen,
  allowFullscreen = true,
  showThumbnails = true,
  onFullscreenChange,
  onCloseRequested,
  height = 300,
  label,
  labelHidden = false,
  hint,
  warning,
  error,
  invalid = false,
  readOnly = false,
  disabled = false,
  controlId,
  onFocus,
  onBlur,
}: EmrImageViewerProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-image-viewer-${reactId}`;

  const gallery: readonly EmrImageItem[] =
    images && images.length > 0
      ? images
      : src
        ? [{ id: 'single', src, alt, caption }]
        : [];

  const [uncontrolledIdx, setUncontrolledIdx] = useState(0);
  const [uncontrolledVp, setUncontrolledVp] = useState<EmrImageViewportState>(
    DEFAULT_IMAGE_VIEWPORT,
  );
  const [uncontrolledFs, setUncontrolledFs] = useState(false);

  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const nativePanOriginRef = useRef<{ panX: number; panY: number }>({ panX: 0, panY: 0 });
  const fsTriggerRef = useRef<{ focus?: () => void } | null>(null);
  const modalCloseBtnRef = useRef<{ focus?: () => void } | null>(null);

  const currentIdx = Math.max(0, Math.min(gallery.length - 1, activeIndex ?? uncontrolledIdx));
  const currentItem = gallery[currentIdx] ?? null;
  const activeVp = viewport ?? uncontrolledVp;
  const isFullscreen = fullscreen ?? uncontrolledFs;
  const rotParts = splitRotationDegrees(activeVp.rotationDeg);
  const isInvalid = invalid || Boolean(error);

  const liveRef = useRef({
    disabled,
    activeVp,
    viewport,
    onViewportChange,
    galleryLength: gallery.length,
    currentIdx,
    isFullscreen,
    allowFullscreen,
    fullscreen,
    onFullscreenChange,
    onCloseRequested,
  });
  liveRef.current = {
    disabled,
    activeVp,
    viewport,
    onViewportChange,
    galleryLength: gallery.length,
    currentIdx,
    isFullscreen,
    allowFullscreen,
    fullscreen,
    onFullscreenChange,
    onCloseRequested,
  };

  const updateVp = (next: EmrImageViewportState) => {
    if (liveRef.current.disabled) return;
    if (liveRef.current.viewport === undefined) {
      setUncontrolledVp(next);
    }
    liveRef.current.onViewportChange?.(next);
  };

  const updateIndex = (nextIdx: number) => {
    if (disabled || gallery.length === 0) return;
    const bounded = ((nextIdx % gallery.length) + gallery.length) % gallery.length;
    if (activeIndex === undefined) {
      setUncontrolledIdx(bounded);
    }
    onActiveIndexChange?.(bounded);
    updateVp(DEFAULT_IMAGE_VIEWPORT);
  };

  const updateFullscreen = (nextFs: boolean, triggerEl?: { focus?: () => void } | null) => {
    if (disabled) return;
    if (nextFs && !allowFullscreen) return;
    if (nextFs && triggerEl) {
      fsTriggerRef.current = triggerEl;
    }
    if (fullscreen === undefined) {
      setUncontrolledFs(nextFs);
    }
    onFullscreenChange?.(nextFs);
    if (!nextFs) {
      onCloseRequested?.();
      const trigger = fsTriggerRef.current;
      fsTriggerRef.current = null;
      if (trigger?.focus && Platform.OS === 'web') {
        setTimeout(() => trigger.focus?.(), 0);
      }
    }
  };

  useEffect(() => {
    if (isFullscreen && Platform.OS === 'web') {
      const timer = setTimeout(() => modalCloseBtnRef.current?.focus?.(), 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isFullscreen]);

  const nativePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => Platform.OS !== 'web' && !liveRef.current.disabled,
        onMoveShouldSetPanResponder: () => Platform.OS !== 'web' && !liveRef.current.disabled,
        onPanResponderGrant: () => {
          nativePanOriginRef.current = {
            panX: liveRef.current.activeVp.panX,
            panY: liveRef.current.activeVp.panY,
          };
        },
        onPanResponderMove: (_evt, gestureState) => {
          if (liveRef.current.disabled) return;
          updateVp({
            ...liveRef.current.activeVp,
            panX: Math.round(nativePanOriginRef.current.panX + gestureState.dx),
            panY: Math.round(nativePanOriginRef.current.panY + gestureState.dy),
          });
        },
      }),
    [],
  );

  const renderViewportSurface = (surfaceHeight: number, inModal: boolean) => (
    <View
      nativeID={inModal ? `${id}-modal` : id}
      style={[
        styles.viewerBox,
        {
          backgroundColor: t.surface,
          borderColor: isInvalid ? t.danger : warning ? t.warning : t.border,
          borderStyle: readOnly ? 'dashed' : 'solid',
          borderRadius: 10,
          opacity: disabled ? 0.55 : 1,
        },
      ]}
      {...(Platform.OS === 'web'
        ? ({
            role: inModal ? 'dialog' : 'region',
            'aria-modal': inModal ? 'true' : undefined,
            'aria-label': label || currentItem?.alt || 'Clinical image viewer',
            'aria-invalid': isInvalid ? 'true' : undefined,
            'aria-disabled': disabled ? 'true' : undefined,
            ...(readOnly ? { dataSet: { readonly: 'true' } } : {}),
            tabIndex: 0,
            onFocus: () => onFocus?.(),
            onBlur: () => onBlur?.(),
            onKeyDown: (e: {
              key: string;
              target?: { tagName?: string };
              preventDefault?: () => void;
            }) => {
              if (disabled) return;
              const tag = e.target?.tagName;
              if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
              if (e.key === 'Escape' && inModal) {
                e.preventDefault?.();
                updateFullscreen(false);
              } else if (e.key === '+' || e.key === '=') {
                e.preventDefault?.();
                updateVp({ ...activeVp, zoom: stepImageZoom(activeVp.zoom, 0.25) });
              } else if (e.key === '-') {
                e.preventDefault?.();
                updateVp({ ...activeVp, zoom: stepImageZoom(activeVp.zoom, -0.25) });
              } else if (e.key === '0') {
                e.preventDefault?.();
                updateVp(DEFAULT_IMAGE_VIEWPORT);
              } else if (e.key === 'r' || e.key === 'R') {
                e.preventDefault?.();
                const nextBase = rotateImage90(rotParts.base90, true);
                updateVp({
                  ...activeVp,
                  rotationDeg: normalizeCombinedRotation(nextBase, rotParts.straighten),
                });
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault?.();
                if (gallery.length > 1) updateIndex(currentIdx - 1);
                else updateVp({ ...activeVp, panX: activeVp.panX - 24 });
              } else if (e.key === 'ArrowRight') {
                e.preventDefault?.();
                if (gallery.length > 1) updateIndex(currentIdx + 1);
                else updateVp({ ...activeVp, panX: activeVp.panX + 24 });
              }
            },
          } as Record<string, unknown>)
        : null)}
    >
      <View
        style={[
          styles.toolbar,
          {
            backgroundColor: t.surfaceSoft,
            borderBottomColor: t.border,
          },
        ]}
        {...(Platform.OS === 'web' ? ({ dataSet: { 'emr-print': 'hide' } } as object) : null)}
      >
        <View style={styles.toolGroup}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Zoom out"
            disabled={disabled}
            onPress={() => updateVp({ ...activeVp, zoom: stepImageZoom(activeVp.zoom, -0.25) })}
            style={({ pressed }) => [
              styles.toolBtn,
              {
                borderColor: t.border,
                backgroundColor: pressed ? t.surfaceRaised : t.surface,
              },
            ]}
          >
            <SvgIcon name="zoom-out" size={16} color={t.text} />
          </Pressable>
          <Text
            style={{
              fontSize: t.textXs,
              fontWeight: fontWeight(t.weightBold),
              color: t.text,
              fontFamily: fontFamily(t),
              minWidth: 44,
              textAlign: 'center',
            }}
          >
            {`${Math.round(activeVp.zoom * 100)}%`}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Zoom in"
            disabled={disabled}
            onPress={() => updateVp({ ...activeVp, zoom: stepImageZoom(activeVp.zoom, 0.25) })}
            style={({ pressed }) => [
              styles.toolBtn,
              {
                borderColor: t.border,
                backgroundColor: pressed ? t.surfaceRaised : t.surface,
              },
            ]}
          >
            <SvgIcon name="zoom-in" size={16} color={t.text} />
          </Pressable>
          <EmrButton
            label="Fit"
            variant="ghost"
            disabled={disabled}
            onPress={() => updateVp(DEFAULT_IMAGE_VIEWPORT)}
          />
        </View>

        <View style={styles.toolGroup}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Rotate counter-clockwise 90 degrees"
            disabled={disabled}
            onPress={() => {
              const nextBase = rotateImage90(rotParts.base90, false);
              updateVp({
                ...activeVp,
                rotationDeg: normalizeCombinedRotation(nextBase, rotParts.straighten),
              });
            }}
            style={({ pressed }) => [
              styles.toolBtn,
              {
                borderColor: t.border,
                backgroundColor: pressed ? t.surfaceRaised : t.surface,
              },
            ]}
          >
            <SvgIcon name="rotate-ccw" size={16} color={t.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Rotate clockwise 90 degrees"
            disabled={disabled}
            onPress={() => {
              const nextBase = rotateImage90(rotParts.base90, true);
              updateVp({
                ...activeVp,
                rotationDeg: normalizeCombinedRotation(nextBase, rotParts.straighten),
              });
            }}
            style={({ pressed }) => [
              styles.toolBtn,
              {
                borderColor: t.border,
                backgroundColor: pressed ? t.surfaceRaised : t.surface,
              },
            ]}
          >
            <SvgIcon name="rotate-cw" size={16} color={t.text} />
          </Pressable>
          {Platform.OS === 'web' ? (
            <View style={styles.straightenWrap}>
              <Text style={{ fontSize: t.textXs, color: t.textMuted, fontFamily: fontFamily(t) }}>
                Straighten
              </Text>
              {createElement('input', {
                type: 'range',
                min: -45,
                max: 45,
                step: 1,
                value: rotParts.straighten,
                disabled,
                'aria-label': 'Straighten angle',
                'aria-valuetext': `${rotParts.straighten} degrees`,
                style: { minHeight: 44, cursor: 'pointer' },
                onChange: (e: { target?: { value?: string } }) => {
                  const deg = Number(e.target?.value ?? 0);
                  const clamped = Math.max(-45, Math.min(45, Number.isFinite(deg) ? deg : 0));
                  updateVp({
                    ...activeVp,
                    rotationDeg: normalizeCombinedRotation(rotParts.base90, clamped),
                  });
                },
              })}
              <Text style={{ fontSize: t.textXs, color: t.textMuted, fontFamily: fontFamily(t) }}>
                {`${rotParts.straighten}°`}
              </Text>
            </View>
          ) : (
            <>
              <EmrButton
                label="-5°"
                variant="ghost"
                disabled={disabled}
                onPress={() =>
                  updateVp({
                    ...activeVp,
                    rotationDeg: clampStraightenAngle(activeVp.rotationDeg - 5),
                  })
                }
              />
              <Text style={{ fontSize: t.textXs, color: t.textMuted, fontFamily: fontFamily(t) }}>
                {`${activeVp.rotationDeg}°`}
              </Text>
              <EmrButton
                label="+5°"
                variant="ghost"
                disabled={disabled}
                onPress={() =>
                  updateVp({
                    ...activeVp,
                    rotationDeg: clampStraightenAngle(activeVp.rotationDeg + 5),
                  })
                }
              />
            </>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Flip horizontal"
            accessibilityState={{ selected: activeVp.flipH }}
            disabled={disabled}
            onPress={() => updateVp({ ...activeVp, flipH: !activeVp.flipH })}
            style={[
              styles.toolBtnWide,
              {
                borderColor: activeVp.flipH ? t.primary : t.border,
                backgroundColor: activeVp.flipH ? t.primarySoft : t.surface,
              },
            ]}
          >
            <SvgIcon name="flip-h" size={16} color={activeVp.flipH ? t.primary : t.text} />
            <Text style={{ fontSize: t.textXs, color: t.text, fontFamily: fontFamily(t) }}>
              Flip H
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Flip vertical"
            accessibilityState={{ selected: activeVp.flipV }}
            disabled={disabled}
            onPress={() => updateVp({ ...activeVp, flipV: !activeVp.flipV })}
            style={[
              styles.toolBtnWide,
              {
                borderColor: activeVp.flipV ? t.primary : t.border,
                backgroundColor: activeVp.flipV ? t.primarySoft : t.surface,
              },
            ]}
          >
            <SvgIcon name="flip-v" size={16} color={activeVp.flipV ? t.primary : t.text} />
            <Text style={{ fontSize: t.textXs, color: t.text, fontFamily: fontFamily(t) }}>
              Flip V
            </Text>
          </Pressable>
          {allowFullscreen ? (
            <Pressable
              ref={
                inModal
                  ? (el) => {
                      modalCloseBtnRef.current = el as unknown as { focus?: () => void } | null;
                    }
                  : undefined
              }
              accessibilityRole="button"
              accessibilityLabel={inModal ? 'Exit fullscreen' : 'Open fullscreen'}
              accessibilityState={{ expanded: inModal }}
              disabled={disabled}
              onPress={(e) =>
                updateFullscreen(
                  !inModal,
                  (e?.currentTarget as unknown as { focus?: () => void } | null) ?? null,
                )
              }
              style={({ pressed }) => [
                styles.toolBtnWide,
                {
                  borderColor: t.border,
                  backgroundColor: pressed ? t.surfaceRaised : t.surface,
                },
              ]}
            >
              <SvgIcon name={inModal ? 'minimize' : 'maximize'} size={16} color={t.text} />
              <Text style={{ fontSize: t.textXs, color: t.text, fontFamily: fontFamily(t) }}>
                {inModal ? 'Close' : 'Fullscreen'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View
        style={[
          styles.stage,
          {
            height: surfaceHeight,
            backgroundColor: t.surfaceSoft,
          },
        ]}
        {...(Platform.OS !== 'web' ? nativePanResponder.panHandlers : null)}
        {...(Platform.OS === 'web'
          ? ({
              onWheel: (e: { deltaY: number; preventDefault?: () => void }) => {
                if (disabled) return;
                e.preventDefault?.();
                updateVp({
                  ...activeVp,
                  zoom: stepImageZoom(activeVp.zoom, e.deltaY < 0 ? 0.15 : -0.15),
                });
              },
              onPointerDown: (e: { clientX: number; clientY: number }) => {
                if (disabled) return;
                dragStartRef.current = {
                  x: e.clientX,
                  y: e.clientY,
                  panX: activeVp.panX,
                  panY: activeVp.panY,
                };
              },
              onPointerMove: (e: { clientX: number; clientY: number }) => {
                if (!dragStartRef.current || disabled) return;
                const dx = e.clientX - dragStartRef.current.x;
                const dy = e.clientY - dragStartRef.current.y;
                updateVp({
                  ...activeVp,
                  panX: Math.round(dragStartRef.current.panX + dx),
                  panY: Math.round(dragStartRef.current.panY + dy),
                });
              },
              onPointerUp: () => {
                dragStartRef.current = null;
              },
              onPointerCancel: () => {
                dragStartRef.current = null;
              },
              onPointerLeave: () => {
                dragStartRef.current = null;
              },
            } as Record<string, unknown>)
          : null)}
      >
        {currentItem ? (
          Platform.OS === 'web' ? (
            createElement('img', {
              src: currentItem.src,
              alt: currentItem.alt,
              draggable: false,
              style: {
                maxWidth: '90%',
                maxHeight: '90%',
                objectFit: 'contain',
                transform: formatImageTransformCss(activeVp),
                transition: dragStartRef.current ? 'none' : 'transform 120ms ease-out',
                userSelect: 'none',
                pointerEvents: 'none',
              },
            })
          ) : (
            <Image
              source={{ uri: currentItem.src }}
              accessibilityLabel={currentItem.alt}
              resizeMode="contain"
              style={{
                width: '90%',
                height: '90%',
                transform: [
                  { translateX: activeVp.panX },
                  { translateY: activeVp.panY },
                  { rotate: `${activeVp.rotationDeg}deg` },
                  { scaleX: (activeVp.flipH ? -1 : 1) * activeVp.zoom },
                  { scaleY: (activeVp.flipV ? -1 : 1) * activeVp.zoom },
                ],
              }}
            />
          )
        ) : (
          <Text style={{ fontSize: t.textSm, color: t.textMuted, fontFamily: fontFamily(t) }}>
            No image loaded
          </Text>
        )}
      </View>

      <View
        style={[
          styles.viewerFooter,
          {
            borderTopColor: t.border,
            backgroundColor: t.surface,
          },
        ]}
      >
        {Platform.OS !== 'web' ? (
          <View style={styles.panControls}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pan left"
              disabled={disabled}
              onPress={() => updateVp({ ...activeVp, panX: activeVp.panX - 24 })}
              style={styles.toolBtn}
            >
              <SvgIcon name="chevron-left" size={15} color={t.textMuted} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pan right"
              disabled={disabled}
              onPress={() => updateVp({ ...activeVp, panX: activeVp.panX + 24 })}
              style={styles.toolBtn}
            >
              <SvgIcon name="chevron-right" size={15} color={t.textMuted} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pan up"
              disabled={disabled}
              onPress={() => updateVp({ ...activeVp, panY: activeVp.panY - 24 })}
              style={styles.toolBtn}
            >
              <SvgIcon name="chevron-up" size={15} color={t.textMuted} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pan down"
              disabled={disabled}
              onPress={() => updateVp({ ...activeVp, panY: activeVp.panY + 24 })}
              style={styles.toolBtn}
            >
              <SvgIcon name="chevron-down" size={15} color={t.textMuted} />
            </Pressable>
          </View>
        ) : null}

        {currentItem?.caption || caption ? (
          <Text
            style={{
              flex: 1,
              fontSize: t.textXs,
              color: t.textMuted,
              fontFamily: fontFamily(t),
              textAlign: 'center',
            }}
          >
            {currentItem?.caption ?? caption}
          </Text>
        ) : null}

        {gallery.length > 1 ? (
          <View style={styles.galleryNav}>
            <EmrButton
              label="Prev"
              variant="ghost"
              disabled={disabled}
              onPress={() => updateIndex(currentIdx - 1)}
            />
            <Text style={{ fontSize: t.textXs, color: t.text, fontFamily: fontFamily(t) }}>
              {`${currentIdx + 1} / ${gallery.length}`}
            </Text>
            <EmrButton
              label="Next"
              variant="ghost"
              disabled={disabled}
              onPress={() => updateIndex(currentIdx + 1)}
            />
          </View>
        ) : null}
      </View>

      {showThumbnails && gallery.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbStrip}
        >
          {gallery.map((item, idx) => {
            const active = idx === currentIdx;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={item.alt || `Image ${idx + 1}`}
                accessibilityState={{ selected: active }}
                disabled={disabled}
                onPress={() => updateIndex(idx)}
                style={[
                  styles.thumbBtn,
                  {
                    borderColor: active ? t.primary : t.border,
                    backgroundColor: t.surface,
                  },
                ]}
              >
                {Platform.OS === 'web' ? (
                  createElement('img', {
                    src: item.src,
                    alt: item.alt || item.id,
                    style: {
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: 4,
                      display: 'block',
                    },
                  })
                ) : (
                  <Image
                    source={{ uri: item.src }}
                    accessibilityLabel={item.alt || item.id}
                    resizeMode="cover"
                    style={{ width: '100%', height: '100%', borderRadius: 4 }}
                  />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );

  return (
    <FieldChrome
      controlId={id}
      label={label}
      labelHidden={labelHidden}
      hint={hint}
      warning={warning}
      error={error}
    >
      {renderViewportSurface(height, false)}
      {isFullscreen ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => updateFullscreen(false)}
        >
          <View
            style={[
              styles.modalBackdrop,
              { backgroundColor: themeColorWithAlpha(t.text, 0.72) },
            ]}
          >
            <View style={styles.modalContent}>{renderViewportSurface(480, true)}</View>
          </View>
        </Modal>
      ) : null}
    </FieldChrome>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. EmrImageCropper
// ─────────────────────────────────────────────────────────────

export interface EmrImageCropperProps {
  readonly src: string;
  readonly alt?: string;
  readonly transform?: EmrImageCropTransform;
  readonly onCropChange?: (transform: EmrImageCropTransform) => void;
  readonly aspectPresets?: readonly EmrAspectPreset[];
  readonly outputMimeType?: string;
  readonly onCropCommitted?: (result: EmrImageCropResult) => void;
  readonly onCancelRequested?: () => void;
  readonly label?: string;
  readonly labelHidden?: boolean;
  readonly hint?: string;
  readonly warning?: string;
  readonly error?: string;
  readonly invalid?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly controlId?: string;
  readonly onFocus?: () => void;
  readonly onBlur?: () => void;
}

export function EmrImageCropper({
  src,
  alt = 'Crop target image',
  transform,
  onCropChange,
  aspectPresets = DEFAULT_ASPECT_PRESETS,
  outputMimeType = 'image/png',
  onCropCommitted,
  onCancelRequested,
  label,
  labelHidden = false,
  hint,
  warning,
  error,
  invalid = false,
  disabled = false,
  readOnly = false,
  controlId,
  onFocus,
  onBlur,
}: EmrImageCropperProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-image-cropper-${reactId}`;

  const [uncontrolledTransform, setUncontrolledTransform] = useState<EmrImageCropTransform>(
    DEFAULT_IMAGE_CROP_TRANSFORM,
  );
  const [stageLayout, setStageLayout] = useState<{ width: number; height: number }>({
    width: 320,
    height: 300,
  });

  const resolvedPresets = aspectPresets.length > 0 ? aspectPresets : DEFAULT_ASPECT_PRESETS;
  const active = transform ?? uncontrolledTransform;
  const interactive = !disabled && !readOnly;
  const rotParts = splitRotationDegrees(active.rotationDeg);
  const isInvalid = invalid || Boolean(error);

  const webImgRef = useRef<HTMLImageElement | null>(null);
  const webCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{
    mode: ReactCropDragMode;
    startX: number;
    startY: number;
    startRect: EmrImageCropRect;
    startPanX: number;
    startPanY: number;
  } | null>(null);
  const nativeCropOriginRef = useRef<EmrImageCropRect>(active.rect);

  const liveRef = useRef({
    interactive,
    active,
    transform,
    onCropChange,
    stageLayout,
  });
  liveRef.current = { interactive, active, transform, onCropChange, stageLayout };

  const updateTransform = (next: EmrImageCropTransform) => {
    if (!liveRef.current.interactive) return;
    const clampedRect = clampCropRect(next.rect, next.aspectRatio);
    const normalized: EmrImageCropTransform = {
      ...next,
      rect: clampedRect,
      rotationDeg: clampStraightenAngle(next.rotationDeg),
      zoom: stepImageZoom(next.zoom, 0),
    };
    if (liveRef.current.transform === undefined) {
      setUncontrolledTransform(normalized);
    }
    liveRef.current.onCropChange?.(normalized);
  };

  const handleSelectAspect = (ratio: number | null) => {
    updateTransform({
      ...active,
      aspectRatio: ratio,
      rect: clampCropRect(active.rect, ratio),
    });
  };

  const adjustRect = (patch: Partial<EmrImageCropRect>) => {
    updateTransform({
      ...active,
      rect: computeAspectLockedCropRect(
        active.rect,
        { ...active.rect, ...patch },
        active.aspectRatio,
      ),
    });
  };

  const handleApplyCrop = () => {
    if (!interactive || !src) return;
    const croppedDataUrl =
      Platform.OS === 'web'
        ? rasterizeWebCanvasCrop(
            webImgRef.current,
            webCanvasRef.current,
            active,
            outputMimeType,
            src,
          )
        : src;
    onCropCommitted?.({
      transform: active,
      croppedDataUrl,
    });
  };

  const nativeBoxResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => Platform.OS !== 'web' && liveRef.current.interactive,
        onMoveShouldSetPanResponder: () => Platform.OS !== 'web' && liveRef.current.interactive,
        onPanResponderGrant: () => {
          nativeCropOriginRef.current = liveRef.current.active.rect;
        },
        onPanResponderMove: (_evt, gestureState) => {
          if (!liveRef.current.interactive) return;
          const w = Math.max(100, liveRef.current.stageLayout.width);
          const h = Math.max(100, liveRef.current.stageLayout.height);
          const cur = liveRef.current.active;
          const origin = nativeCropOriginRef.current;
          updateTransform({
            ...cur,
            rect: clampCropRect(
              {
                ...origin,
                x: origin.x + gestureState.dx / w,
                y: origin.y + gestureState.dy / h,
              },
              cur.aspectRatio,
            ),
          });
        },
      }),
    [],
  );

  const focusedPresetIdx = Math.max(
    0,
    resolvedPresets.findIndex((p) => p.ratio === active.aspectRatio),
  );

  const renderWebHandle = (
    corner: 'nw' | 'ne' | 'sw' | 'se',
    ariaLabel: string,
    posStyle: Record<string, number | string>,
  ) =>
    createElement(
      'button',
      {
        key: corner,
        type: 'button',
        'aria-label': ariaLabel,
        disabled: !interactive,
        onPointerDown: (e: {
          clientX: number;
          clientY: number;
          stopPropagation?: () => void;
          preventDefault?: () => void;
        }) => {
          if (!interactive) return;
          e.stopPropagation?.();
          e.preventDefault?.();
          dragRef.current = {
            mode: corner,
            startX: e.clientX,
            startY: e.clientY,
            startRect: active.rect,
            startPanX: active.panX,
            startPanY: active.panY,
          };
        },
        style: {
          position: 'absolute',
          width: 44,
          height: 44,
          display: 'grid',
          placeItems: 'center',
          background: 'transparent',
          border: 0,
          padding: 0,
          touchAction: 'none',
          cursor: corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize',
          ...posStyle,
        },
      },
      createElement('span', {
        'aria-hidden': 'true',
        style: {
          width: 14,
          height: 14,
          borderRadius: '50%',
          backgroundColor: t.primary,
          border: `2px solid ${t.surface}`,
          display: 'block',
        },
      }),
    );

  return (
    <FieldChrome
      controlId={id}
      label={label}
      labelHidden={labelHidden}
      hint={hint}
      warning={warning}
      error={error}
    >
      <View
        nativeID={id}
        style={[
          styles.cropperContainer,
          {
            backgroundColor: t.surface,
            borderColor: isInvalid ? t.danger : warning ? t.warning : t.border,
            borderStyle: readOnly ? 'dashed' : 'solid',
            borderRadius: 10,
            opacity: disabled ? 0.55 : 1,
          },
        ]}
        {...(Platform.OS === 'web'
          ? ({
              role: 'group',
              'aria-label': label || 'Image cropper',
              'aria-invalid': isInvalid ? 'true' : undefined,
              ...(readOnly ? { dataSet: { readonly: 'true' } } : {}),
              onFocus: () => onFocus?.(),
              onBlur: () => onBlur?.(),
            } as Record<string, unknown>)
          : null)}
      >
        <View
          style={[
            styles.presetBar,
            {
              backgroundColor: t.surfaceSoft,
              borderBottomColor: t.border,
            },
          ]}
          {...(Platform.OS === 'web'
            ? ({
                role: 'radiogroup',
                'aria-label': 'Aspect ratio presets',
                onKeyDown: (e: {
                  key: string;
                  currentTarget?: { querySelectorAll?: (sel: string) => HTMLElement[] };
                  preventDefault?: () => void;
                }) => {
                  if (!interactive || resolvedPresets.length === 0) return;
                  let nextIdx = -1;
                  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    nextIdx = (focusedPresetIdx + 1) % resolvedPresets.length;
                  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    nextIdx =
                      (focusedPresetIdx - 1 + resolvedPresets.length) % resolvedPresets.length;
                  } else if (e.key === 'Home') {
                    nextIdx = 0;
                  } else if (e.key === 'End') {
                    nextIdx = resolvedPresets.length - 1;
                  }
                  if (nextIdx >= 0) {
                    e.preventDefault?.();
                    handleSelectAspect(resolvedPresets[nextIdx]!.ratio);
                    const radios = e.currentTarget?.querySelectorAll?.('[role="radio"]');
                    radios?.[nextIdx]?.focus?.();
                  }
                },
              } as Record<string, unknown>)
            : null)}
        >
          <Text
            style={{
              fontSize: t.textXs,
              fontWeight: fontWeight(t.weightBold),
              color: t.textMuted,
              fontFamily: fontFamily(t),
            }}
          >
            Aspect:
          </Text>
          {resolvedPresets.map((preset) => {
            const isSelected = active.aspectRatio === preset.ratio;
            return (
              <Pressable
                key={preset.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected, disabled: !interactive }}
                disabled={!interactive}
                onPress={() => handleSelectAspect(preset.ratio)}
                style={[
                  styles.presetBtn,
                  {
                    borderColor: isSelected ? t.primary : t.border,
                    backgroundColor: isSelected ? t.primary : t.surface,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: t.textXs,
                    fontWeight: fontWeight(t.weightMedium),
                    color: isSelected ? t.primaryContrast : t.text,
                    fontFamily: fontFamily(t),
                  }}
                >
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            if (width > 0 && height > 0) setStageLayout({ width, height });
          }}
          style={[
            styles.cropStage,
            {
              backgroundColor: t.surfaceSoft,
            },
          ]}
          {...(Platform.OS === 'web'
            ? ({
                onPointerDown: (e: { clientX: number; clientY: number }) => {
                  if (!interactive) return;
                  dragRef.current = {
                    mode: 'pan',
                    startX: e.clientX,
                    startY: e.clientY,
                    startRect: active.rect,
                    startPanX: active.panX,
                    startPanY: active.panY,
                  };
                },
                onPointerMove: (e: { clientX: number; clientY: number }) => {
                  if (!dragRef.current || !interactive) return;
                  const d = dragRef.current;
                  if (d.mode === 'pan') {
                    updateTransform({
                      ...active,
                      panX: Math.round(d.startPanX + (e.clientX - d.startX)),
                      panY: Math.round(d.startPanY + (e.clientY - d.startY)),
                    });
                    return;
                  }
                  const w = Math.max(100, stageLayout.width);
                  const h = Math.max(100, stageLayout.height);
                  const dx = (e.clientX - d.startX) / w;
                  const dy = (e.clientY - d.startY) / h;
                  const nextRect = applyReactCropDrag(
                    d.mode,
                    d.startRect,
                    dx,
                    dy,
                    active.aspectRatio,
                  );
                  updateTransform({ ...active, rect: nextRect });
                },
                onPointerUp: () => {
                  dragRef.current = null;
                },
                onPointerCancel: () => {
                  dragRef.current = null;
                },
                onPointerLeave: () => {
                  dragRef.current = null;
                },
              } as Record<string, unknown>)
            : null)}
        >
          {Platform.OS === 'web' ? (
            <>
              {createElement('img', {
                ref: (el: HTMLImageElement | null) => {
                  webImgRef.current = el;
                },
                src,
                alt,
                draggable: false,
                style: {
                  maxWidth: '88%',
                  maxHeight: '88%',
                  objectFit: 'contain',
                  pointerEvents: 'none',
                  transform: formatImageTransformCss({
                    zoom: active.zoom,
                    panX: active.panX,
                    panY: active.panY,
                    rotationDeg: active.rotationDeg,
                    flipH: active.flipH,
                    flipV: active.flipV,
                  }),
                },
              })}
              {createElement('canvas', {
                ref: (el: HTMLCanvasElement | null) => {
                  webCanvasRef.current = el;
                },
                hidden: true,
                'aria-hidden': 'true',
              })}
              {createElement(
                'div',
                {
                  role: 'group',
                  tabIndex: interactive ? 0 : -1,
                  'aria-label':
                    'Crop region. Use arrow keys to move, Shift plus arrow keys to resize.',
                  onPointerDown: (e: {
                    clientX: number;
                    clientY: number;
                    stopPropagation?: () => void;
                  }) => {
                    if (!interactive) return;
                    e.stopPropagation?.();
                    dragRef.current = {
                      mode: 'move',
                      startX: e.clientX,
                      startY: e.clientY,
                      startRect: active.rect,
                      startPanX: active.panX,
                      startPanY: active.panY,
                    };
                  },
                  onKeyDown: (e: {
                    key: string;
                    shiftKey?: boolean;
                    preventDefault?: () => void;
                  }) => {
                    if (!interactive) return;
                    const step = e.shiftKey ? 0.05 : 0.02;
                    let nextRect: EmrImageCropRect | null = null;
                    if (e.shiftKey) {
                      if (e.key === 'ArrowRight') {
                        nextRect = computeAspectLockedCropRect(
                          active.rect,
                          { ...active.rect, width: active.rect.width + step },
                          active.aspectRatio,
                        );
                      } else if (e.key === 'ArrowLeft') {
                        nextRect = computeAspectLockedCropRect(
                          active.rect,
                          { ...active.rect, width: active.rect.width - step },
                          active.aspectRatio,
                        );
                      } else if (e.key === 'ArrowDown') {
                        nextRect = computeAspectLockedCropRect(
                          active.rect,
                          { ...active.rect, height: active.rect.height + step },
                          active.aspectRatio,
                        );
                      } else if (e.key === 'ArrowUp') {
                        nextRect = computeAspectLockedCropRect(
                          active.rect,
                          { ...active.rect, height: active.rect.height - step },
                          active.aspectRatio,
                        );
                      }
                    } else {
                      if (e.key === 'ArrowRight') {
                        nextRect = clampCropRect(
                          { ...active.rect, x: active.rect.x + step },
                          active.aspectRatio,
                        );
                      } else if (e.key === 'ArrowLeft') {
                        nextRect = clampCropRect(
                          { ...active.rect, x: active.rect.x - step },
                          active.aspectRatio,
                        );
                      } else if (e.key === 'ArrowDown') {
                        nextRect = clampCropRect(
                          { ...active.rect, y: active.rect.y + step },
                          active.aspectRatio,
                        );
                      } else if (e.key === 'ArrowUp') {
                        nextRect = clampCropRect(
                          { ...active.rect, y: active.rect.y - step },
                          active.aspectRatio,
                        );
                      }
                    }
                    if (nextRect) {
                      e.preventDefault?.();
                      updateTransform({ ...active, rect: nextRect });
                    }
                  },
                  style: {
                    position: 'absolute',
                    left: `${Math.round(active.rect.x * 1000) / 10}%`,
                    top: `${Math.round(active.rect.y * 1000) / 10}%`,
                    width: `${Math.round(active.rect.width * 1000) / 10}%`,
                    height: `${Math.round(active.rect.height * 1000) / 10}%`,
                    border: `2px solid ${t.primary}`,
                    boxShadow: `0 0 0 9999px ${themeColorWithAlpha(t.text, 0.42)}`,
                    cursor: interactive ? 'move' : 'default',
                    boxSizing: 'border-box',
                    touchAction: 'none',
                  },
                },
                createElement(
                  'span',
                  {
                    style: {
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      padding: '2px 6px',
                      borderRadius: 6,
                      backgroundColor: t.primary,
                      color: t.primaryContrast,
                      fontSize: t.text2xs,
                      fontWeight: 700,
                      pointerEvents: 'none',
                    },
                  },
                  `${Math.round(active.rect.width * 100)}% × ${Math.round(active.rect.height * 100)}%`,
                ),
                renderWebHandle('nw', 'Resize crop region top-left', { left: -22, top: -22 }),
                renderWebHandle('ne', 'Resize crop region top-right', { right: -22, top: -22 }),
                renderWebHandle('sw', 'Resize crop region bottom-left', { left: -22, bottom: -22 }),
                renderWebHandle('se', 'Resize crop region bottom-right', { right: -22, bottom: -22 }),
              )}
            </>
          ) : (
            <>
              <Image
                source={{ uri: src }}
                accessibilityLabel={alt}
                resizeMode="contain"
                style={{
                  width: '88%',
                  height: '88%',
                  transform: [
                    { translateX: active.panX },
                    { translateY: active.panY },
                    { rotate: `${active.rotationDeg}deg` },
                    { scaleX: (active.flipH ? -1 : 1) * active.zoom },
                    { scaleY: (active.flipV ? -1 : 1) * active.zoom },
                  ],
                }}
              />
              <View
                {...nativeBoxResponder.panHandlers}
                style={[
                  styles.cropOverlayBox,
                  {
                    left: `${Math.round(active.rect.x * 100)}%`,
                    top: `${Math.round(active.rect.y * 100)}%`,
                    width: `${Math.round(active.rect.width * 100)}%`,
                    height: `${Math.round(active.rect.height * 100)}%`,
                    borderColor: t.primary,
                    backgroundColor: themeColorWithAlpha(t.primary, 0.12),
                  },
                ]}
              >
                <View
                  style={[
                    styles.cropReadoutBadge,
                    {
                      backgroundColor: t.primary,
                      borderRadius: 6,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: t.text2xs,
                      color: t.primaryContrast,
                      fontWeight: fontWeight(t.weightBold),
                      fontFamily: fontFamily(t),
                    }}
                  >
                    {`${Math.round(active.rect.width * 100)}% × ${Math.round(active.rect.height * 100)}%`}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        <View
          style={[
            styles.cropControlsGrid,
            {
              borderTopColor: t.border,
            },
          ]}
        >
          <View style={styles.toolGroup}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Zoom out"
              disabled={!interactive}
              onPress={() =>
                updateTransform({ ...active, zoom: stepImageZoom(active.zoom, -0.25) })
              }
              style={[styles.toolBtn, { borderColor: t.border, backgroundColor: t.surface }]}
            >
              <SvgIcon name="zoom-out" size={16} color={t.text} />
            </Pressable>
            <Text
              style={{
                fontSize: t.textXs,
                fontWeight: fontWeight(t.weightBold),
                color: t.text,
                fontFamily: fontFamily(t),
                minWidth: 44,
                textAlign: 'center',
              }}
            >
              {`${Math.round(active.zoom * 100)}%`}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Zoom in"
              disabled={!interactive}
              onPress={() =>
                updateTransform({ ...active, zoom: stepImageZoom(active.zoom, 0.25) })
              }
              style={[styles.toolBtn, { borderColor: t.border, backgroundColor: t.surface }]}
            >
              <SvgIcon name="zoom-in" size={16} color={t.text} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Rotate counter-clockwise 90 degrees"
              disabled={!interactive}
              onPress={() => {
                const nextBase = rotateImage90(rotParts.base90, false);
                updateTransform({
                  ...active,
                  rotationDeg: normalizeCombinedRotation(nextBase, rotParts.straighten),
                });
              }}
              style={[styles.toolBtn, { borderColor: t.border, backgroundColor: t.surface }]}
            >
              <SvgIcon name="rotate-ccw" size={16} color={t.text} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Rotate clockwise 90 degrees"
              disabled={!interactive}
              onPress={() => {
                const nextBase = rotateImage90(rotParts.base90, true);
                updateTransform({
                  ...active,
                  rotationDeg: normalizeCombinedRotation(nextBase, rotParts.straighten),
                });
              }}
              style={[styles.toolBtn, { borderColor: t.border, backgroundColor: t.surface }]}
            >
              <SvgIcon name="rotate-cw" size={16} color={t.text} />
            </Pressable>
            {Platform.OS === 'web' ? (
              <View style={styles.straightenWrap}>
                <Text style={{ fontSize: t.textXs, color: t.textMuted, fontFamily: fontFamily(t) }}>
                  Straighten
                </Text>
                {createElement('input', {
                  type: 'range',
                  min: -45,
                  max: 45,
                  step: 1,
                  value: rotParts.straighten,
                  disabled: !interactive,
                  'aria-label': 'Straighten crop angle',
                  'aria-valuetext': `${rotParts.straighten} degrees`,
                  style: { minHeight: 44, cursor: 'pointer' },
                  onChange: (e: { target?: { value?: string } }) => {
                    const deg = Number(e.target?.value ?? 0);
                    const clamped = Math.max(-45, Math.min(45, Number.isFinite(deg) ? deg : 0));
                    updateTransform({
                      ...active,
                      rotationDeg: normalizeCombinedRotation(rotParts.base90, clamped),
                    });
                  },
                })}
                <Text style={{ fontSize: t.textXs, color: t.textMuted, fontFamily: fontFamily(t) }}>
                  {`${rotParts.straighten}°`}
                </Text>
              </View>
            ) : (
              <>
                <EmrButton
                  label="-5°"
                  variant="ghost"
                  disabled={!interactive}
                  onPress={() =>
                    updateTransform({
                      ...active,
                      rotationDeg: clampStraightenAngle(active.rotationDeg - 5),
                    })
                  }
                />
                <EmrButton
                  label="+5°"
                  variant="ghost"
                  disabled={!interactive}
                  onPress={() =>
                    updateTransform({
                      ...active,
                      rotationDeg: clampStraightenAngle(active.rotationDeg + 5),
                    })
                  }
                />
              </>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Flip horizontal"
              accessibilityState={{ selected: active.flipH }}
              disabled={!interactive}
              onPress={() => updateTransform({ ...active, flipH: !active.flipH })}
              style={[
                styles.toolBtnWide,
                {
                  borderColor: active.flipH ? t.primary : t.border,
                  backgroundColor: active.flipH ? t.primarySoft : t.surface,
                },
              ]}
            >
              <SvgIcon name="flip-h" size={16} color={active.flipH ? t.primary : t.text} />
              <Text style={{ fontSize: t.textXs, color: t.text, fontFamily: fontFamily(t) }}>
                Flip H
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Flip vertical"
              accessibilityState={{ selected: active.flipV }}
              disabled={!interactive}
              onPress={() => updateTransform({ ...active, flipV: !active.flipV })}
              style={[
                styles.toolBtnWide,
                {
                  borderColor: active.flipV ? t.primary : t.border,
                  backgroundColor: active.flipV ? t.primarySoft : t.surface,
                },
              ]}
            >
              <SvgIcon name="flip-v" size={16} color={active.flipV ? t.primary : t.text} />
              <Text style={{ fontSize: t.textXs, color: t.text, fontFamily: fontFamily(t) }}>
                Flip V
              </Text>
            </Pressable>
          </View>

          <View style={styles.toolGroup}>
            <EmrButton
              label="Crop Smaller"
              variant="ghost"
              disabled={!interactive}
              onPress={() =>
                adjustRect({
                  x: active.rect.x + 0.05,
                  y: active.rect.y + 0.05,
                  width: active.rect.width - 0.1,
                  height: active.rect.height - 0.1,
                })
              }
            />
            <EmrButton
              label="Crop Larger"
              variant="ghost"
              disabled={!interactive}
              onPress={() =>
                adjustRect({
                  x: active.rect.x - 0.05,
                  y: active.rect.y - 0.05,
                  width: active.rect.width + 0.1,
                  height: active.rect.height + 0.1,
                })
              }
            />
          </View>

          <View style={styles.cropFooterActions}>
            <EmrButton
              label="Reset"
              variant="ghost"
              disabled={!interactive}
              onPress={() => updateTransform(DEFAULT_IMAGE_CROP_TRANSFORM)}
            />
            <View style={styles.toolGroup}>
              {onCancelRequested ? (
                <EmrButton
                  label="Cancel"
                  variant="secondary"
                  disabled={disabled}
                  onPress={onCancelRequested}
                />
              ) : null}
              <EmrButton
                label="Apply crop"
                variant="primary"
                disabled={!interactive || !src}
                onPress={handleApplyCrop}
              />
            </View>
          </View>
        </View>
      </View>
    </FieldChrome>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. EmrImageUpload
// ─────────────────────────────────────────────────────────────

export interface EmrImageUploadProps {
  readonly items?: readonly EmrUploadedImageItem[];
  readonly onItemsChange?: (items: readonly EmrUploadedImageItem[]) => void;
  readonly onFilesSelected?: (files: readonly EmrFileSelectionItem[]) => void;
  readonly onNativeFilesSelected?: (files: readonly File[]) => void;
  readonly onImageCropped?: (id: string, result: EmrImageCropResult) => void;
  readonly onRemoveRequested?: (id: string) => void;
  readonly onCaptionChange?: (id: string, caption: string) => void;
  readonly onCameraRequested?: () => void;
  readonly onChooseFilesRequested?: () => void;
  readonly accept?: string;
  readonly multiple?: boolean;
  readonly maxFiles?: number;
  readonly maxSizeBytes?: number;
  readonly allowCamera?: boolean;
  readonly aspectPresets?: readonly EmrAspectPreset[];
  readonly buttonLabel?: string;
  readonly dropHint?: string;
  readonly emptyLabel?: string;
  readonly cropOutputMimeType?: string;
  readonly label?: string;
  readonly labelHidden?: boolean;
  readonly hint?: string;
  readonly error?: string;
  readonly warning?: string;
  readonly info?: string;
  readonly messages?: readonly FieldValidationLine[];
  readonly invalid?: boolean;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly controlId?: string;
  readonly onFocus?: () => void;
  readonly onBlur?: () => void;
}

export function EmrImageUpload({
  items = [],
  onItemsChange,
  onFilesSelected,
  onNativeFilesSelected,
  onImageCropped,
  onRemoveRequested,
  onCaptionChange,
  onCameraRequested,
  onChooseFilesRequested,
  accept = 'image/*',
  multiple = true,
  maxFiles,
  maxSizeBytes,
  allowCamera = false,
  aspectPresets = DEFAULT_ASPECT_PRESETS,
  buttonLabel,
  dropHint = 'Drag and drop clinical images here, or browse to preview and crop.',
  emptyLabel = 'No images uploaded.',
  cropOutputMimeType = 'image/png',
  label,
  labelHidden = false,
  hint,
  error,
  warning,
  info,
  messages,
  invalid = false,
  required,
  disabled = false,
  readOnly = false,
  controlId,
  onFocus,
  onBlur,
}: EmrImageUploadProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-image-upload-${reactId}`;

  const fileInputRef = useRef<{ click?: () => void; value?: string } | null>(null);
  const cameraInputRef = useRef<{ click?: () => void; value?: string } | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const [dragActive, setDragActive] = useState(false);
  const [internalError, setInternalError] = useState('');
  const [viewingItemId, setViewingItemId] = useState<string | null>(null);
  const [croppingItemId, setCroppingItemId] = useState<string | null>(null);

  const interactive = !disabled && !readOnly;
  const isAtMaxLimit = maxFiles !== undefined && items.length >= maxFiles;
  const effectiveError = error || internalError || undefined;
  const isInvalid =
    invalid ||
    Boolean(effectiveError) ||
    Boolean(messages?.some((m) => m.severity === 'error'));
  const resolvedBtnLabel = buttonLabel?.trim() || (multiple ? 'Choose images' : 'Choose image');
  const capacityText =
    maxFiles !== undefined
      ? isAtMaxLimit
        ? `Maximum of ${maxFiles} images reached`
        : `${items.length} of ${maxFiles} uploaded`
      : '';

  const handleRawFiles = (fileList: ArrayLike<File> | null | undefined) => {
    if (!interactive || isAtMaxLimit || !fileList) return;
    const rawAll = Array.from(fileList);
    if (rawAll.length === 0) return;

    const validFiles: File[] = [];
    const errors: string[] = [];
    for (const file of rawAll) {
      const validationMsg = validateUploadedImageFile(
        { name: file.name, sizeBytes: file.size, mimeType: file.type },
        { accept, maxSizeBytes },
      );
      if (validationMsg) {
        errors.push(validationMsg);
      } else {
        validFiles.push(file);
      }
    }
    setInternalError(errors[0] ?? '');

    const remaining =
      maxFiles !== undefined ? Math.max(0, maxFiles - items.length) : validFiles.length;
    const picked = (multiple ? validFiles : validFiles.slice(0, 1)).slice(0, remaining);
    if (picked.length === 0) return;

    const selectionMeta: EmrFileSelectionItem[] = picked.map((f) => ({
      name: f.name,
      sizeBytes: f.size,
      mimeType: f.type || 'image/jpeg',
      ...(typeof f.lastModified === 'number' ? { lastModified: f.lastModified } : {}),
    }));
    onFilesSelected?.(selectionMeta);
    onNativeFilesSelected?.(picked);

    const newUploaded: EmrUploadedImageItem[] = picked.map((f, idx) => {
      const placeholder = `data:${f.type || 'image/png'};base64,`;
      return {
        id: `img-${Date.now()}-${idx}`,
        name: f.name,
        src: placeholder,
        previewSrc: placeholder,
        mimeType: f.type || 'image/jpeg',
        sizeBytes: f.size,
        alt: f.name,
      };
    });

    const nextItems = multiple ? [...items, ...newUploaded] : newUploaded.slice(0, 1);
    onItemsChange?.(nextItems);

    if (typeof FileReader !== 'undefined') {
      let latestList = nextItems;
      picked.forEach((file, idx) => {
        const targetId = newUploaded[idx]?.id;
        if (!targetId) return;
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = typeof reader.result === 'string' ? reader.result : null;
          if (!dataUrl) return;
          const base = itemsRef.current.some((e) => e.id === targetId)
            ? itemsRef.current
            : latestList;
          latestList = base.map((entry) =>
            entry.id === targetId ? { ...entry, src: dataUrl, previewSrc: dataUrl } : entry,
          );
          onItemsChange?.(latestList);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemove = (targetId: string) => {
    if (!interactive) return;
    onRemoveRequested?.(targetId);
    onItemsChange?.(items.filter((item) => item.id !== targetId));
  };

  const handleCaptionEdit = (targetId: string, caption: string) => {
    if (!interactive) return;
    onCaptionChange?.(targetId, caption);
    onItemsChange?.(items.map((item) => (item.id === targetId ? { ...item, caption } : item)));
  };

  const handleCropCommit = (targetId: string, result: EmrImageCropResult) => {
    if (!interactive) return;
    onImageCropped?.(targetId, result);
    onItemsChange?.(
      items.map((item) =>
        item.id === targetId
          ? {
              ...item,
              cropTransform: result.transform,
              previewSrc: result.croppedDataUrl ?? item.previewSrc ?? item.src,
            }
          : item,
      ),
    );
    setCroppingItemId(null);
  };

  const viewingIndex = viewingItemId ? items.findIndex((item) => item.id === viewingItemId) : -1;
  const croppingItem = croppingItemId
    ? items.find((item) => item.id === croppingItemId) ?? null
    : null;

  return (
    <FieldChrome
      controlId={id}
      label={label}
      labelHidden={labelHidden}
      hint={hint}
      error={effectiveError}
      warning={warning}
      info={info}
      messages={messages}
      required={required}
    >
      <View
        style={styles.uploadStack}
        {...(Platform.OS === 'web'
          ? ({
              ...(readOnly ? { dataSet: { readonly: 'true' } } : {}),
              onFocus: () => onFocus?.(),
              onBlur: () => onBlur?.(),
            } as Record<string, unknown>)
          : null)}
      >
        {!readOnly ? (
          <View
            style={[
              styles.dropzone,
              {
                backgroundColor: dragActive ? t.primarySoft : t.surfaceSoft,
                borderColor: dragActive
                  ? t.primary
                  : isInvalid
                    ? t.danger
                    : warning
                      ? t.warning
                      : t.border,
                borderRadius: 8,
                opacity: disabled || isAtMaxLimit ? 0.6 : 1,
              },
            ]}
            {...(Platform.OS === 'web'
              ? ({
                  dataSet: { 'emr-print': 'hide' },
                  onDragOver: (e: { preventDefault: () => void }) => {
                    if (!interactive || isAtMaxLimit) return;
                    e.preventDefault();
                    setDragActive(true);
                  },
                  onDragLeave: () => setDragActive(false),
                  onDrop: (e: {
                    preventDefault: () => void;
                    dataTransfer?: { files?: ArrayLike<File> };
                  }) => {
                    e.preventDefault();
                    setDragActive(false);
                    handleRawFiles(e.dataTransfer?.files);
                  },
                } as Record<string, unknown>)
              : null)}
          >
            {Platform.OS === 'web' ? (
              <>
                {createElement('input', {
                  ref: (el: { click?: () => void; value?: string } | null) => {
                    fileInputRef.current = el;
                  },
                  id: `${id}-file`,
                  type: 'file',
                  accept,
                  multiple,
                  disabled: !interactive || isAtMaxLimit,
                  'aria-invalid': isInvalid ? 'true' : undefined,
                  'aria-required': required ? 'true' : undefined,
                  style: { display: 'none' },
                  onChange: (e: { target?: { files?: ArrayLike<File>; value?: string } }) => {
                    handleRawFiles(e.target?.files);
                    if (e.target) e.target.value = '';
                  },
                })}
                {allowCamera
                  ? createElement('input', {
                      ref: (el: { click?: () => void; value?: string } | null) => {
                        cameraInputRef.current = el;
                      },
                      id: `${id}-camera`,
                      type: 'file',
                      accept: 'image/*',
                      capture: 'environment',
                      disabled: !interactive || isAtMaxLimit,
                      style: { display: 'none' },
                      onChange: (e: { target?: { files?: ArrayLike<File>; value?: string } }) => {
                        handleRawFiles(e.target?.files);
                        if (e.target) e.target.value = '';
                      },
                    })
                  : null}
              </>
            ) : null}

            <View style={styles.dropzoneHeader}>
              <SvgIcon name="upload" size={20} color={t.primary} />
              <Text
                style={{
                  fontSize: t.textSm,
                  fontWeight: fontWeight(t.weightMedium),
                  color: t.text,
                  fontFamily: fontFamily(t),
                  textAlign: 'center',
                }}
              >
                {dropHint}
              </Text>
              {capacityText || maxSizeBytes ? (
                <Text
                  style={{
                    fontSize: t.textXs,
                    color: t.textMuted,
                    fontFamily: fontFamily(t),
                    textAlign: 'center',
                  }}
                >
                  {[capacityText, maxSizeBytes ? `Max size: ${formatL1ByteSize(maxSizeBytes)}` : '']
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              ) : null}
            </View>

            <View style={styles.dropzoneButtons}>
              <EmrButton
                label={resolvedBtnLabel}
                variant="secondary"
                disabled={!interactive || isAtMaxLimit}
                onPress={() => {
                  if (Platform.OS === 'web') {
                    fileInputRef.current?.click?.();
                  } else {
                    onChooseFilesRequested?.();
                  }
                }}
              />
              {allowCamera ? (
                <EmrButton
                  label="Take photo"
                  variant="ghost"
                  disabled={!interactive || isAtMaxLimit}
                  onPress={() => {
                    onCameraRequested?.();
                    if (Platform.OS === 'web') {
                      cameraInputRef.current?.click?.();
                    }
                  }}
                />
              ) : null}
            </View>
          </View>
        ) : items.length === 0 ? (
          <Text style={{ fontSize: t.textSm, color: t.textMuted, fontFamily: fontFamily(t) }}>
            {emptyLabel}
          </Text>
        ) : null}

        {items.length > 0 ? (
          <View style={styles.grid}>
            {items.map((item) => {
              const displaySrc = item.previewSrc ?? item.src;
              const sizeText = formatL1ByteSize(item.sizeBytes);
              return (
                <View
                  key={item.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: readOnly ? t.surfaceSoft : t.surface,
                      borderColor: t.border,
                      borderStyle: readOnly ? 'dashed' : 'solid',
                      borderRadius: 10,
                      opacity: disabled ? 0.55 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.thumbBox,
                      {
                        backgroundColor: t.surfaceSoft,
                      },
                    ]}
                  >
                    {Platform.OS === 'web' ? (
                      createElement('img', {
                        src: displaySrc,
                        alt: item.alt ?? item.name,
                        style: {
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        },
                      })
                    ) : (
                      <Image
                        source={{ uri: displaySrc }}
                        accessibilityLabel={item.alt ?? item.name}
                        resizeMode="cover"
                        style={{ width: '100%', height: '100%' }}
                      />
                    )}
                    {item.cropTransform ? (
                      <View style={styles.croppedBadgeWrap}>
                        <EmrBadgeView badge={{ label: 'Edited', tone: 'info' }} />
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.cardMetaRow}>
                      <Text
                        numberOfLines={1}
                        style={{
                          flex: 1,
                          fontSize: t.textSm,
                          fontWeight: fontWeight(t.weightBold),
                          color: t.text,
                          fontFamily: fontFamily(t),
                        }}
                      >
                        {item.name}
                      </Text>
                      {sizeText ? (
                        <Text
                          style={{
                            fontSize: t.textXs,
                            color: t.textMuted,
                            fontFamily: fontFamily(t),
                          }}
                        >
                          {sizeText}
                        </Text>
                      ) : null}
                    </View>

                    <TextInput
                      value={item.caption ?? ''}
                      editable={interactive}
                      placeholder="Add clinical caption…"
                      placeholderTextColor={t.textMuted}
                      accessibilityLabel={`Caption for ${item.name}`}
                      onChangeText={(text) => handleCaptionEdit(item.id, text)}
                      style={[
                        styles.captionInput,
                        {
                          fontSize: t.textXs,
                          color: t.text,
                          borderColor: t.border,
                          borderStyle: readOnly ? 'dashed' : 'solid',
                          backgroundColor: readOnly || disabled ? t.surfaceSoft : t.surface,
                          borderRadius: 6,
                          fontFamily: fontFamily(t),
                        },
                      ]}
                    />

                    <View
                      style={styles.cardActions}
                      {...(Platform.OS === 'web' ? ({ dataSet: { 'emr-print': 'hide' } } as object) : null)}
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`View ${item.name}`}
                        disabled={disabled}
                        onPress={() => setViewingItemId(item.id)}
                        style={[styles.cardActionBtn, { borderColor: t.border }]}
                      >
                        <SvgIcon name="eye" size={15} color={t.text} />
                        <Text style={{ fontSize: t.textXs, color: t.text, fontFamily: fontFamily(t) }}>
                          View
                        </Text>
                      </Pressable>
                      {interactive ? (
                        <>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Crop or rotate ${item.name}`}
                            onPress={() => setCroppingItemId(item.id)}
                            style={[styles.cardActionBtn, { borderColor: t.border }]}
                          >
                            <SvgIcon name="crop" size={15} color={t.text} />
                            <Text style={{ fontSize: t.textXs, color: t.text, fontFamily: fontFamily(t) }}>
                              Crop / Rotate
                            </Text>
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Remove ${item.name}`}
                            onPress={() => handleRemove(item.id)}
                            style={[styles.cardActionBtn, { borderColor: t.border }]}
                          >
                            <SvgIcon name="trash" size={15} color={t.danger} />
                            <Text style={{ fontSize: t.textXs, color: t.danger, fontFamily: fontFamily(t) }}>
                              Remove
                            </Text>
                          </Pressable>
                        </>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        {viewingIndex >= 0 ? (
          <EmrImageViewer
            images={items.map((it) => ({
              id: it.id,
              src: it.previewSrc ?? it.src,
              alt: it.alt ?? it.name,
              caption: it.caption,
            }))}
            activeIndex={viewingIndex}
            onActiveIndexChange={(idx) => {
              const target = items[idx];
              if (target) setViewingItemId(target.id);
            }}
            fullscreen
            onFullscreenChange={(fs) => {
              if (!fs) setViewingItemId(null);
            }}
            onCloseRequested={() => setViewingItemId(null)}
          />
        ) : null}

        {croppingItem ? (
          <Modal
            visible
            transparent
            animationType="fade"
            onRequestClose={() => setCroppingItemId(null)}
          >
            <View
              style={[
                styles.modalBackdrop,
                { backgroundColor: themeColorWithAlpha(t.text, 0.72) },
              ]}
            >
              <ScrollView contentContainerStyle={styles.modalContent}>
                <EmrImageCropper
                  label={`Crop / Rotate: ${croppingItem.name}`}
                  src={croppingItem.src}
                  alt={croppingItem.alt ?? croppingItem.name}
                  transform={croppingItem.cropTransform}
                  aspectPresets={aspectPresets}
                  outputMimeType={cropOutputMimeType}
                  onCancelRequested={() => setCroppingItemId(null)}
                  onCropCommitted={(res) => handleCropCommit(croppingItem.id, res)}
                />
              </ScrollView>
            </View>
          </Modal>
        ) : null}
      </View>
    </FieldChrome>
  );
}

const styles = StyleSheet.create({
  viewerBox: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    maxWidth: '100%',
  },
  toolGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    maxWidth: '100%',
  },
  toolBtn: {
    minWidth: 44,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnWide: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  straightenWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    maxWidth: '100%',
  },
  stage: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  viewerFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopWidth: 1,
  },
  panControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  galleryNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  thumbStrip: {
    flexDirection: 'row',
    gap: 6,
    padding: 8,
  },
  thumbBtn: {
    width: 48,
    height: 48,
    padding: 2,
    borderWidth: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  cropperContainer: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  presetBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  presetBtn: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropStage: {
    height: 300,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cropOverlayBox: {
    position: 'absolute',
    borderWidth: 2,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 4,
  },
  cropReadoutBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cropControlsGrid: {
    padding: 10,
    gap: 8,
    borderTopWidth: 1,
  },
  cropFooterActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  uploadStack: {
    gap: 12,
  },
  dropzone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  dropzoneHeader: {
    alignItems: 'center',
    gap: 4,
  },
  dropzoneButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 240,
    maxWidth: '100%',
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbBox: {
    height: 140,
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  croppedBadgeWrap: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  cardBody: {
    padding: 10,
    gap: 8,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  captionInput: {
    minHeight: 44,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  cardActionBtn: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
