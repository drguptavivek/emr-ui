import type {
  AnnotationLayerRecord,
  AnnotationListIntent,
  AnnotationListItem,
  AnnotationListViewModel,
  EmrAnnotationListLabels,
} from '@drguptavivek/emr-controller';

/** Tool -> the same `shape-*` glyph id the toolbar draws, so a row and its tool button read as one. */
export const ANNOTATION_LIST_TOOL_GLYPH: Readonly<Record<AnnotationLayerRecord['tool'], string>> = {
  text: 'shape-text',
  line: 'shape-line',
  arrow: 'shape-arrow',
  callout: 'shape-callout',
  curve: 'shape-curve',
  circle: 'shape-ellipse',
  polygon: 'shape-polygon',
  freeform: 'shape-freehand',
};

/** Accessible name and tooltip for the icon-only tool marker; never shown as visible words. */
export const ANNOTATION_LIST_TOOL_NAME: Readonly<Record<AnnotationLayerRecord['tool'], string>> = {
  text: 'Text',
  line: 'Line',
  arrow: 'Arrow',
  callout: 'Callout',
  curve: 'Curve',
  circle: 'Circle',
  polygon: 'Polygon',
  freeform: 'Freehand',
};

export const ANNOTATION_LIST_NAV_KEYS: readonly string[] = ['ArrowDown', 'ArrowUp', 'Home', 'End'];

export interface ResolvedAnnotationListLabels {
  readonly listAria: string;
  readonly locked: string;
  readonly hidden: string;
  readonly drawingPrefix: string;
  readonly showTitle: string;
  readonly hideTitle: string;
  readonly lockTitle: string;
  readonly unlockTitle: string;
  readonly moveUpTitle: string;
  readonly moveDownTitle: string;
  readonly deleteTitle: string;
  readonly showDrawing: (num: number, name: string) => string;
  readonly lockDrawing: (num: number, name: string) => string;
  readonly moveUpDrawing: (num: number, name: string) => string;
  readonly moveDownDrawing: (num: number, name: string) => string;
  readonly deleteDrawing: (num: number, name: string) => string;
}

const DEFAULT_LIST_LABELS: ResolvedAnnotationListLabels = {
  listAria: 'Annotations',
  locked: 'Locked',
  hidden: 'Hidden',
  drawingPrefix: 'Drawing',
  showTitle: 'Show drawing',
  hideTitle: 'Hide drawing',
  lockTitle: 'Lock drawing',
  unlockTitle: 'Unlock drawing',
  moveUpTitle: 'Move up',
  moveDownTitle: 'Move down',
  deleteTitle: 'Delete drawing',
  showDrawing: (num: number, name: string) => `Show drawing ${num}, ${name}`,
  lockDrawing: (num: number, name: string) => `Lock drawing ${num}, ${name}`,
  moveUpDrawing: (num: number, name: string) => `Move drawing ${num} up, ${name}`,
  moveDownDrawing: (num: number, name: string) => `Move drawing ${num} down, ${name}`,
  deleteDrawing: (num: number, name: string) => `Delete drawing ${num}, ${name}`,
};

export function resolveAnnotationListLabels(
  labels?: EmrAnnotationListLabels,
): ResolvedAnnotationListLabels {
  return { ...DEFAULT_LIST_LABELS, ...labels };
}

export function resolveAnnotationListId(
  idPrefix = '',
  headingId?: string | null,
): string {
  const prefix = idPrefix.trim().replace(/-+$/, '');
  if (prefix) return `${prefix}-emr-annotation-list`;
  const heading = headingId?.trim();
  if (heading) return `${heading}-list`;
  return 'emr-annotation-list';
}

export function resolveAnnotationListRowId(idPrefix: string, layerId: string): string {
  const prefix = idPrefix.trim().replace(/-+$/, '');
  return prefix ? `${prefix}-al-row-${layerId}` : `emr-al-row-${layerId}`;
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

export function annotationPrimaryLabel(it: AnnotationListItem): string {
  return it.classLabel || it.layer.label;
}

export function annotationSecondaryLabel(it: AnnotationListItem): string {
  return it.classLabel && it.layer.label && it.layer.label !== it.classLabel ? it.layer.label : '';
}

export function annotationFullSummary(it: AnnotationListItem): string {
  return [annotationPrimaryLabel(it), annotationSecondaryLabel(it), it.description].filter(Boolean).join(' · ');
}

export function resolveAnnotationListActiveId(
  model: Pick<AnnotationListViewModel, 'items' | 'selectedLayerId'>,
  currentActive?: string | null,
): string | undefined {
  const ids = model.items.map((item) => item.layer.id);
  if (model.selectedLayerId && ids.includes(model.selectedLayerId)) {
    return currentActive && ids.includes(currentActive) ? currentActive : model.selectedLayerId;
  }
  if (currentActive && ids.includes(currentActive)) return currentActive;
  return ids[0];
}
