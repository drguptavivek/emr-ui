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
import { createElement, useId, useRef, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SvgIcon } from './icons';
import { FieldChrome, type FieldValidationLine } from './l1-field-chrome';
import {
  clampCropRect,
  clampStraightenAngle,
  DEFAULT_ASPECT_PRESETS,
  DEFAULT_IMAGE_CROP_TRANSFORM,
  DEFAULT_IMAGE_VIEWPORT,
  formatImageTransformCss,
  formatL1ByteSize,
  rotateImage90,
  stepImageZoom,
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
  readonly onFullscreenChange?: (fullscreen: boolean) => void;
  readonly height?: number;
  readonly label?: string;
  readonly hint?: string;
  readonly error?: string;
  readonly disabled?: boolean;
  readonly controlId?: string;
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
  onFullscreenChange,
  height = 300,
  label,
  hint,
  error,
  disabled = false,
  controlId,
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
    DEFAULT_IMAGE_VIEWPORT
  );
  const [uncontrolledFs, setUncontrolledFs] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(
    null
  );

  const currentIdx = Math.max(
    0,
    Math.min(gallery.length - 1, activeIndex ?? uncontrolledIdx)
  );
  const currentItem = gallery[currentIdx] ?? null;
  const activeVp = viewport ?? uncontrolledVp;
  const isFullscreen = fullscreen ?? uncontrolledFs;

  const updateVp = (next: EmrImageViewportState) => {
    if (disabled) return;
    if (viewport === undefined) {
      setUncontrolledVp(next);
    }
    onViewportChange?.(next);
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

  const updateFullscreen = (nextFs: boolean) => {
    if (disabled) return;
    if (fullscreen === undefined) {
      setUncontrolledFs(nextFs);
    }
    onFullscreenChange?.(nextFs);
  };

  const renderViewportSurface = (surfaceHeight: number, inModal: boolean) => (
    <View
      style={[
        styles.viewerBox,
        {
          backgroundColor: t.surface,
          borderColor: error ? t.danger : t.border,
          borderRadius: 8,
        },
      ]}
    >
      <View
        style={[
          styles.toolbar,
          {
            backgroundColor: t.surfaceSoft,
            borderBottomColor: t.border,
          },
        ]}
      >
        <View style={styles.toolGroup}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Zoom out"
            disabled={disabled}
            onPress={() =>
              updateVp({ ...activeVp, zoom: stepImageZoom(activeVp.zoom, -0.25) })
            }
            style={styles.toolBtn}
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
            onPress={() =>
              updateVp({ ...activeVp, zoom: stepImageZoom(activeVp.zoom, 0.25) })
            }
            style={styles.toolBtn}
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
            onPress={() =>
              updateVp({
                ...activeVp,
                rotationDeg: rotateImage90(activeVp.rotationDeg, false),
              })
            }
            style={styles.toolBtn}
          >
            <SvgIcon name="undo" size={16} color={t.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Rotate clockwise 90 degrees"
            disabled={disabled}
            onPress={() =>
              updateVp({
                ...activeVp,
                rotationDeg: rotateImage90(activeVp.rotationDeg, true),
              })
            }
            style={styles.toolBtn}
          >
            <SvgIcon name="redo" size={16} color={t.text} />
          </Pressable>
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
          <Text
            style={{
              fontSize: t.textXs,
              color: t.textMuted,
              fontFamily: fontFamily(t),
            }}
          >
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
          <EmrButton
            label="Flip H"
            variant={activeVp.flipH ? 'secondary' : 'ghost'}
            disabled={disabled}
            onPress={() => updateVp({ ...activeVp, flipH: !activeVp.flipH })}
          />
          <EmrButton
            label="Flip V"
            variant={activeVp.flipV ? 'secondary' : 'ghost'}
            disabled={disabled}
            onPress={() => updateVp({ ...activeVp, flipV: !activeVp.flipV })}
          />
          {allowFullscreen ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={inModal ? 'Exit fullscreen' : 'Open fullscreen'}
              disabled={disabled}
              onPress={() => updateFullscreen(!inModal)}
              style={styles.toolBtn}
            >
              <SvgIcon
                name={inModal ? 'close' : 'maximize'}
                size={16}
                color={t.text}
              />
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
        {...(Platform.OS === 'web'
          ? ({
              onMouseDown: (e: { clientX: number; clientY: number }) => {
                if (disabled) return;
                dragStartRef.current = {
                  x: e.clientX,
                  y: e.clientY,
                  panX: activeVp.panX,
                  panY: activeVp.panY,
                };
              },
              onMouseMove: (e: { clientX: number; clientY: number }) => {
                if (!dragStartRef.current || disabled) return;
                const dx = e.clientX - dragStartRef.current.x;
                const dy = e.clientY - dragStartRef.current.y;
                updateVp({
                  ...activeVp,
                  panX: Math.round(dragStartRef.current.panX + dx),
                  panY: Math.round(dragStartRef.current.panY + dy),
                });
              },
              onMouseUp: () => {
                dragStartRef.current = null;
              },
              onMouseLeave: () => {
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
          <Text
            style={{
              fontSize: t.textSm,
              color: t.textMuted,
              fontFamily: fontFamily(t),
            }}
          >
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
            <Text
              style={{
                fontSize: t.textXs,
                color: t.text,
                fontFamily: fontFamily(t),
              }}
            >
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
    </View>
  );

  return (
    <FieldChrome controlId={id} label={label} hint={hint} error={error}>
      {renderViewportSurface(height, false)}
      {isFullscreen ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => updateFullscreen(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              {renderViewportSurface(480, true)}
            </View>
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
  readonly onCropCommitted?: (result: EmrImageCropResult) => void;
  readonly onCancelRequested?: () => void;
  readonly label?: string;
  readonly hint?: string;
  readonly error?: string;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly controlId?: string;
}

export function EmrImageCropper({
  src,
  alt = 'Crop target image',
  transform,
  onCropChange,
  aspectPresets = DEFAULT_ASPECT_PRESETS,
  onCropCommitted,
  onCancelRequested,
  label,
  hint,
  error,
  disabled = false,
  readOnly = false,
  controlId,
}: EmrImageCropperProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-image-cropper-${reactId}`;

  const [uncontrolledTransform, setUncontrolledTransform] =
    useState<EmrImageCropTransform>(DEFAULT_IMAGE_CROP_TRANSFORM);

  const active = transform ?? uncontrolledTransform;
  const interactive = !disabled && !readOnly;

  const updateTransform = (next: EmrImageCropTransform) => {
    if (!interactive) return;
    const clampedRect = clampCropRect(next.rect, next.aspectRatio);
    const normalized: EmrImageCropTransform = {
      ...next,
      rect: clampedRect,
      rotationDeg: clampStraightenAngle(next.rotationDeg),
      zoom: stepImageZoom(next.zoom, 0),
    };
    if (transform === undefined) {
      setUncontrolledTransform(normalized);
    }
    onCropChange?.(normalized);
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
      rect: clampCropRect({ ...active.rect, ...patch }, active.aspectRatio),
    });
  };

  const handleApplyCrop = () => {
    if (!interactive) return;
    onCropCommitted?.({
      transform: active,
      croppedDataUrl: src,
    });
  };

  return (
    <FieldChrome controlId={id} label={label} hint={hint} error={error}>
      <View
        style={[
          styles.cropperContainer,
          {
            backgroundColor: t.surface,
            borderColor: error ? t.danger : t.border,
            borderRadius: 8,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.presetBar,
            {
              backgroundColor: t.surfaceSoft,
              borderBottomColor: t.border,
            },
          ]}
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
          {aspectPresets.map((preset) => {
            const isSelected = active.aspectRatio === preset.ratio;
            return (
              <EmrButton
                key={preset.id}
                label={preset.label}
                variant={isSelected ? 'primary' : 'ghost'}
                disabled={!interactive}
                onPress={() => handleSelectAspect(preset.ratio)}
              />
            );
          })}
        </View>

        <View
          style={[
            styles.cropStage,
            {
              backgroundColor: t.surfaceSoft,
            },
          ]}
        >
          {Platform.OS === 'web' ? (
            createElement('img', {
              src,
              alt,
              draggable: false,
              style: {
                maxWidth: '88%',
                maxHeight: '88%',
                objectFit: 'contain',
                transform: formatImageTransformCss({
                  zoom: active.zoom,
                  panX: active.panX,
                  panY: active.panY,
                  rotationDeg: active.rotationDeg,
                  flipH: active.flipH,
                  flipV: active.flipV,
                }),
              },
            })
          ) : (
            <Image
              source={{ uri: src }}
              accessibilityLabel={alt}
              resizeMode="contain"
              style={{ width: '88%', height: '88%' }}
            />
          )}

          <View
            pointerEvents="none"
            style={[
              styles.cropOverlayBox,
              {
                left: `${Math.round(active.rect.x * 100)}%`,
                top: `${Math.round(active.rect.y * 100)}%`,
                width: `${Math.round(active.rect.width * 100)}%`,
                height: `${Math.round(active.rect.height * 100)}%`,
                borderColor: t.primary,
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
                  color: '#ffffff',
                  fontWeight: fontWeight(t.weightBold),
                  fontFamily: fontFamily(t),
                }}
              >
                {`${Math.round(active.rect.width * 100)}% × ${Math.round(active.rect.height * 100)}%`}
              </Text>
            </View>
          </View>
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
            <EmrButton
              label="Zoom -"
              variant="ghost"
              disabled={!interactive}
              onPress={() =>
                updateTransform({
                  ...active,
                  zoom: stepImageZoom(active.zoom, -0.25),
                })
              }
            />
            <EmrButton
              label="Zoom +"
              variant="ghost"
              disabled={!interactive}
              onPress={() =>
                updateTransform({
                  ...active,
                  zoom: stepImageZoom(active.zoom, 0.25),
                })
              }
            />
            <EmrButton
              label="Rotate -90°"
              variant="ghost"
              disabled={!interactive}
              onPress={() =>
                updateTransform({
                  ...active,
                  rotationDeg: rotateImage90(active.rotationDeg, false),
                })
              }
            />
            <EmrButton
              label="Rotate +90°"
              variant="ghost"
              disabled={!interactive}
              onPress={() =>
                updateTransform({
                  ...active,
                  rotationDeg: rotateImage90(active.rotationDeg, true),
                })
              }
            />
            <EmrButton
              label="Straighten -5°"
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
              label="Straighten +5°"
              variant="ghost"
              disabled={!interactive}
              onPress={() =>
                updateTransform({
                  ...active,
                  rotationDeg: clampStraightenAngle(active.rotationDeg + 5),
                })
              }
            />
            <EmrButton
              label="Flip H"
              variant={active.flipH ? 'secondary' : 'ghost'}
              disabled={!interactive}
              onPress={() =>
                updateTransform({ ...active, flipH: !active.flipH })
              }
            />
            <EmrButton
              label="Flip V"
              variant={active.flipV ? 'secondary' : 'ghost'}
              disabled={!interactive}
              onPress={() =>
                updateTransform({ ...active, flipV: !active.flipV })
              }
            />
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
                  onPress={onCancelRequested}
                />
              ) : null}
              <EmrButton
                label="Apply crop"
                variant="primary"
                disabled={!interactive}
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
  readonly multiple?: boolean;
  readonly maxFiles?: number;
  readonly maxSizeBytes?: number;
  readonly allowCamera?: boolean;
  readonly aspectPresets?: readonly EmrAspectPreset[];
  readonly label?: string;
  readonly hint?: string;
  readonly error?: string;
  readonly warning?: string;
  readonly info?: string;
  readonly messages?: readonly FieldValidationLine[];
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly controlId?: string;
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
  multiple = true,
  maxFiles,
  maxSizeBytes,
  allowCamera = true,
  aspectPresets = DEFAULT_ASPECT_PRESETS,
  label,
  hint,
  error,
  warning,
  info,
  messages,
  required,
  disabled = false,
  readOnly = false,
  controlId,
}: EmrImageUploadProps) {
  const t = useEmrTheme();
  const reactId = useId().replace(/:/g, '');
  const id = controlId ?? `emr-image-upload-${reactId}`;

  const fileInputRef = useRef<{ click?: () => void; value?: string } | null>(null);
  const cameraInputRef = useRef<{ click?: () => void; value?: string } | null>(null);

  const [dragActive, setDragActive] = useState(false);
  const [viewingItemId, setViewingItemId] = useState<string | null>(null);
  const [croppingItemId, setCroppingItemId] = useState<string | null>(null);

  const interactive = !disabled && !readOnly;
  const canAddMore = maxFiles === undefined || items.length < maxFiles;

  const handleRawFiles = (fileList: ArrayLike<File> | null | undefined) => {
    if (!interactive || !fileList) return;
    const rawAll = Array.from(fileList);
    if (rawAll.length === 0) return;

    const remaining =
      maxFiles !== undefined ? Math.max(0, maxFiles - items.length) : rawAll.length;
    const picked = (multiple ? rawAll : rawAll.slice(0, 1)).slice(0, remaining);
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
      const url =
        typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
          ? URL.createObjectURL(f)
          : `data:${f.type || 'image/png'};base64,`;
      return {
        id: `img-${Date.now()}-${idx}`,
        name: f.name,
        src: url,
        previewSrc: url,
        mimeType: f.type || 'image/jpeg',
        sizeBytes: f.size,
        alt: f.name,
      };
    });

    const nextItems = multiple ? [...items, ...newUploaded] : newUploaded.slice(0, 1);
    onItemsChange?.(nextItems);
  };

  const handleRemove = (targetId: string) => {
    if (!interactive) return;
    onRemoveRequested?.(targetId);
    onItemsChange?.(items.filter((item) => item.id !== targetId));
  };

  const handleCaptionEdit = (targetId: string, caption: string) => {
    if (!interactive) return;
    onCaptionChange?.(targetId, caption);
    onItemsChange?.(
      items.map((item) => (item.id === targetId ? { ...item, caption } : item))
    );
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
          : item
      )
    );
    setCroppingItemId(null);
  };

  const viewingIndex = viewingItemId
    ? items.findIndex((item) => item.id === viewingItemId)
    : -1;
  const croppingItem = croppingItemId
    ? items.find((item) => item.id === croppingItemId) ?? null
    : null;

  return (
    <FieldChrome
      controlId={id}
      label={label}
      hint={hint}
      error={error}
      warning={warning}
      info={info}
      messages={messages}
      required={required}
    >
      <View style={styles.uploadStack}>
        {interactive && canAddMore ? (
          <View
            style={[
              styles.dropzone,
              {
                backgroundColor: dragActive ? t.primarySoft : t.surfaceSoft,
                borderColor: dragActive ? t.primary : error ? t.danger : t.border,
                borderRadius: 8,
              },
            ]}
            {...(Platform.OS === 'web'
              ? ({
                  onDragOver: (e: { preventDefault: () => void }) => {
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
                  type: 'file',
                  accept: 'image/*',
                  multiple,
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
                      type: 'file',
                      accept: 'image/*',
                      capture: 'environment',
                      style: { display: 'none' },
                      onChange: (e: {
                        target?: { files?: ArrayLike<File>; value?: string };
                      }) => {
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
                }}
              >
                Drop clinical images here or select files
              </Text>
              {maxSizeBytes ? (
                <Text
                  style={{
                    fontSize: t.textXs,
                    color: t.textMuted,
                    fontFamily: fontFamily(t),
                  }}
                >
                  {`Max file size: ${formatL1ByteSize(maxSizeBytes)}`}
                </Text>
              ) : null}
            </View>

            <View style={styles.dropzoneButtons}>
              <EmrButton
                label="Choose image"
                variant="secondary"
                onPress={() => fileInputRef.current?.click?.()}
              />
              {allowCamera ? (
                <EmrButton
                  label="Camera"
                  variant="ghost"
                  onPress={() => {
                    onCameraRequested?.();
                    cameraInputRef.current?.click?.();
                  }}
                />
              ) : null}
            </View>
          </View>
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
                      backgroundColor: t.surface,
                      borderColor: t.border,
                      borderRadius: 8,
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
                          transform: item.cropTransform
                            ? formatImageTransformCss({
                                zoom: item.cropTransform.zoom,
                                panX: item.cropTransform.panX,
                                panY: item.cropTransform.panY,
                                rotationDeg: item.cropTransform.rotationDeg,
                                flipH: item.cropTransform.flipH,
                                flipV: item.cropTransform.flipV,
                              })
                            : undefined,
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
                        <EmrBadgeView
                          badge={{ label: 'Edited', tone: 'info' }}
                        />
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
                          backgroundColor: readOnly ? t.surfaceSoft : t.surface,
                          borderRadius: 6,
                          fontFamily: fontFamily(t),
                        },
                      ]}
                    />

                    <View style={styles.cardActions}>
                      <EmrButton
                        label="View"
                        variant="ghost"
                        onPress={() => setViewingItemId(item.id)}
                      />
                      {interactive ? (
                        <>
                          <EmrButton
                            label="Crop / Rotate"
                            variant="ghost"
                            onPress={() => setCroppingItemId(item.id)}
                          />
                          <EmrButton
                            label="Remove"
                            variant="ghost"
                            onPress={() => handleRemove(item.id)}
                          />
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
          />
        ) : null}

        {croppingItem ? (
          <Modal
            visible
            transparent
            animationType="fade"
            onRequestClose={() => setCroppingItemId(null)}
          >
            <View style={styles.modalBackdrop}>
              <ScrollView contentContainerStyle={styles.modalContent}>
                <EmrImageCropper
                  label={`Crop / Rotate: ${croppingItem.name}`}
                  src={croppingItem.src}
                  alt={croppingItem.alt ?? croppingItem.name}
                  transform={croppingItem.cropTransform}
                  aspectPresets={aspectPresets}
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
  },
  toolGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  toolBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 2,
  },
  galleryNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
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
    borderStyle: 'dashed',
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
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
    width: 260,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbBox: {
    height: 150,
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
    gap: 4,
  },
});
