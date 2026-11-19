import type { AnnotationLayerRecord } from './annotation.models.js';

/** One numbered row. Order, numbering, lock state and visibility are all supplied; the list holds none of them. */
export interface AnnotationListItem {
  readonly layer: AnnotationLayerRecord;
  readonly number: number;
  /** Controller-resolved classification text (for example a lesion class), not an id. */
  readonly classLabel?: string;
  readonly locked?: boolean;
  /** Shown on a second line and as the row tooltip. */
  readonly description?: string;
}

export interface AnnotationListViewModel {
  readonly items: readonly AnnotationListItem[];
  readonly selectedLayerId?: string;
  readonly emptyMessage: string;
  /** A plain legend: number, swatch, annotation and tool icon only. Every row action is hidden; selecting stays available. */
  readonly readOnly?: boolean;
  /** Shows the lock button. Default false: lock means nothing until marks can be moved. */
  readonly canLock?: boolean;
}

/** `layerRenameRequested` is part of the contract for the controller; this list has no rename control yet. */
export type AnnotationListIntent =
  | { readonly type: 'layerSelected'; readonly layerId: string }
  | { readonly type: 'layerVisibilityToggleRequested'; readonly layerId: string }
  | { readonly type: 'layerLockToggleRequested'; readonly layerId: string }
  | { readonly type: 'layerMoveRequested'; readonly layerId: string; readonly direction: 'up' | 'down' }
  | { readonly type: 'layerRemoveRequested'; readonly layerId: string }
  | { readonly type: 'layerRenameRequested'; readonly layerId: string; readonly label: string };

export interface EmrAnnotationListLabels {
  readonly listAria?: string;
  readonly locked?: string;
  readonly hidden?: string;
  readonly drawingPrefix?: string;
  readonly showTitle?: string;
  readonly hideTitle?: string;
  readonly lockTitle?: string;
  readonly unlockTitle?: string;
  readonly moveUpTitle?: string;
  readonly moveDownTitle?: string;
  readonly deleteTitle?: string;
  readonly showDrawing?: (num: number, name: string) => string;
  readonly lockDrawing?: (num: number, name: string) => string;
  readonly moveUpDrawing?: (num: number, name: string) => string;
  readonly moveDownDrawing?: (num: number, name: string) => string;
  readonly deleteDrawing?: (num: number, name: string) => string;
}

export function canToggleAnnotationLayerVisibility(
  model: Pick<AnnotationListViewModel, 'items' | 'readOnly'>,
  layerId: string,
): boolean {
  if (model.readOnly) return false;
  return model.items.some((item) => item.layer.id === layerId);
}

export function canToggleAnnotationLayerLock(
  model: Pick<AnnotationListViewModel, 'items' | 'readOnly' | 'canLock'>,
  layerId: string,
): boolean {
  if (model.readOnly || !model.canLock) return false;
  return model.items.some((item) => item.layer.id === layerId);
}

export function canMoveAnnotationLayer(
  model: Pick<AnnotationListViewModel, 'items' | 'readOnly'>,
  layerId: string,
  direction: 'up' | 'down',
): boolean {
  if (model.readOnly) return false;
  const index = model.items.findIndex((item) => item.layer.id === layerId);
  if (index < 0 || model.items[index].locked) return false;
  const target = index + (direction === 'up' ? -1 : 1);
  return target >= 0 && target < model.items.length;
}

export function canRemoveAnnotationLayer(
  model: Pick<AnnotationListViewModel, 'items' | 'readOnly'>,
  layerId: string,
): boolean {
  if (model.readOnly) return false;
  const item = model.items.find((entry) => entry.layer.id === layerId);
  return Boolean(item && !item.locked);
}

export function canTriggerAnnotationListIntent(
  model: AnnotationListViewModel,
  intent: AnnotationListIntent,
): boolean {
  switch (intent.type) {
    case 'layerSelected':
      return model.items.some((item) => item.layer.id === intent.layerId);
    case 'layerVisibilityToggleRequested':
      return canToggleAnnotationLayerVisibility(model, intent.layerId);
    case 'layerLockToggleRequested':
      return canToggleAnnotationLayerLock(model, intent.layerId);
    case 'layerMoveRequested':
      return canMoveAnnotationLayer(model, intent.layerId, intent.direction);
    case 'layerRemoveRequested':
      return canRemoveAnnotationLayer(model, intent.layerId);
    case 'layerRenameRequested':
      return !model.readOnly && model.items.some((item) => item.layer.id === intent.layerId && !item.locked);
  }
}

export function resolveAnnotationListId(
  idPrefix = '',
  headingId?: string | null,
  fallbackId = 'emr-annotation-list',
): string {
  const prefix = idPrefix.trim().replace(/-+$/, '');
  if (prefix) return `${prefix}-emr-annotation-list`;
  const heading = headingId?.trim();
  if (heading) return `${heading}-list`;
  return fallbackId;
}
