import type {
  AnnotationToolbarIntent,
  AnnotationToolbarViewModel,
  EmrAnnotationToolbarLabels,
  ToolbarTool,
} from '@drguptavivek/emr-controller';

/** Registered heroicons. A tool icon that is neither a `shape-*` glyph nor one of these shows its label initial. */
export const ANNOTATION_TOOLBAR_KNOWN_ICONS = new Set<string>([
  'heroCursorArrowRays',
  'heroArrowsPointingOut',
  'heroHandRaised',
  'heroBackspace',
  'heroPencil',
  'heroPencilSquare',
  'heroMinus',
  'heroArrowLongRight',
  'heroArrowTrendingUp',
  'heroSquare2Stack',
  'heroStop',
  'heroCircleStack',
  'heroBars3BottomLeft',
]);

/** Purpose-drawn inline glyphs for geometric tools, selected by `tool.icon`. */
export const ANNOTATION_TOOLBAR_GLYPHS = new Set<string>([
  'shape-line',
  'shape-arrow',
  'shape-curve',
  'shape-rect',
  'shape-ellipse',
  'shape-polygon',
  'shape-freehand',
  'shape-text',
  'shape-eraser',
  'shape-callout',
  'shape-suture',
  'shape-hatch',
  'shape-lattice',
]);

export const ANNOTATION_TOOLBAR_NAV_KEYS: readonly string[] = [
  'ArrowRight',
  'ArrowLeft',
  'ArrowDown',
  'ArrowUp',
  'Home',
  'End',
];

export interface ResolvedAnnotationToolbarLabels {
  readonly toolbarAria: string;
  readonly toolsGroup: string;
  readonly penGroup: string;
  readonly penPrefix: string;
  readonly penFallback: string;
  readonly penPanelAria: string;
  readonly colourGroup: string;
  readonly widthGroup: string;
  readonly historyGroup: string;
  readonly undo: string;
  readonly redo: string;
  readonly zoomGroup: string;
  readonly zoomOut: string;
  readonly zoomIn: string;
  readonly zoomFit: string;
  readonly zoomReset: string;
  readonly zoomResetAria: (zoomLabel: string) => string;
  readonly saveGroup: string;
  readonly save: string;
}

const DEFAULT_TOOLBAR_LABELS: ResolvedAnnotationToolbarLabels = {
  toolbarAria: 'Annotation tools',
  toolsGroup: 'Tools',
  penGroup: 'Pen',
  penPrefix: 'Pen',
  penFallback: 'Pen colour and width',
  penPanelAria: 'Pen colour and width',
  colourGroup: 'Colour',
  widthGroup: 'Line width',
  historyGroup: 'History',
  undo: 'Undo',
  redo: 'Redo',
  zoomGroup: 'Zoom',
  zoomOut: 'Zoom out',
  zoomIn: 'Zoom in',
  zoomFit: 'Fit to view',
  zoomReset: 'Reset zoom',
  zoomResetAria: (zoomLabel: string) => `Reset zoom, currently ${zoomLabel}`,
  saveGroup: 'Save',
  save: 'Save annotations',
};

export function resolveAnnotationToolbarLabels(
  labels?: EmrAnnotationToolbarLabels,
): ResolvedAnnotationToolbarLabels {
  return { ...DEFAULT_TOOLBAR_LABELS, ...labels };
}

export function resolveAnnotationToolbarPanelId(
  idPrefix = '',
  headingId?: string | null,
): string {
  const prefix = idPrefix.trim().replace(/-+$/, '');
  if (prefix) return `${prefix}-emr-tb-pen-panel`;
  const heading = headingId?.trim();
  if (heading) return `${heading}-pen-panel`;
  return 'emr-tb-pen-panel';
}

export function hasAnnotationToolbarPen(
  model: Pick<AnnotationToolbarViewModel, 'colours' | 'widths'>,
): boolean {
  return model.colours.length > 0 || model.widths.length > 0;
}

export function canSelectToolbarTool(
  model: Pick<AnnotationToolbarViewModel, 'readOnly' | 'tools'>,
  toolId: string,
): boolean {
  if (model.readOnly) return false;
  return model.tools.some((tool) => tool.id === toolId && !tool.disabled);
}

export function canTriggerToolbarIntent(
  model: AnnotationToolbarViewModel,
  intent: AnnotationToolbarIntent,
): boolean {
  switch (intent.type) {
    case 'toolSelected':
      return canSelectToolbarTool(model, intent.toolId);
    case 'colourSelected':
      return !model.readOnly && model.colours.some((c) => c.id === intent.colourId);
    case 'widthSelected':
      return !model.readOnly && model.widths.some((w) => w.id === intent.widthId);
    case 'undoRequested':
      return !model.readOnly && model.canUndo;
    case 'redoRequested':
      return !model.readOnly && model.canRedo;
    case 'saveRequested':
      return !model.readOnly && model.canSave;
    case 'zoomInRequested':
    case 'zoomOutRequested':
    case 'zoomFitRequested':
    case 'zoomResetRequested':
      return !model.zoomLocked;
  }
}

export function resolveToolbarEnabledKeys(model: AnnotationToolbarViewModel): string[] {
  const off = !!model.readOnly;
  return [
    ...model.tools.filter((t) => !off && !t.disabled).map((t) => `t:${t.id}`),
    ...(!off && hasAnnotationToolbarPen(model) ? ['pen'] : []),
    ...(!off && model.canUndo ? ['undo'] : []),
    ...(!off && model.canRedo ? ['redo'] : []),
    ...(model.zoomLocked ? [] : ['zoomOut', 'zoomReset', 'zoomIn', 'zoomFit']),
    ...(!off && model.canSave ? ['save'] : []),
  ];
}

export function resolveToolbarActiveStop(
  model: AnnotationToolbarViewModel,
  focusedKey: string | null | undefined,
): string | undefined {
  const keys = resolveToolbarEnabledKeys(model);
  if (focusedKey && keys.includes(focusedKey)) return focusedKey;
  const sel = model.selectedToolId ? `t:${model.selectedToolId}` : '';
  return keys.includes(sel) ? sel : keys[0];
}

export function resolveToolbarPenLabel(
  model: Pick<AnnotationToolbarViewModel, 'colours' | 'selectedColourId' | 'widths' | 'selectedWidthId'>,
  labels: Pick<ResolvedAnnotationToolbarLabels, 'penPrefix' | 'penFallback'>,
): string {
  const colour = model.colours.find((c) => c.id === model.selectedColourId)?.label;
  const width = model.widths.find((w) => w.id === model.selectedWidthId)?.label;
  const parts = [colour, width].filter((p): p is string => Boolean(p));
  return parts.length ? `${labels.penPrefix}: ${parts.join(', ')}` : labels.penFallback;
}

export function resolveToolbarToolTitle(tool: Pick<ToolbarTool, 'label' | 'shortcutLabel'>): string {
  return tool.shortcutLabel ? `${tool.label} (${tool.shortcutLabel})` : tool.label;
}
