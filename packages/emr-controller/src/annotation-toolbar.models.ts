/**
 * Generic, canvas-agnostic annotation toolbar contract. The toolbar renders supplied
 * tools, colours and widths and emits intents; it never knows what a tool does and holds
 * no geometry, history, zoom or colour state.
 */

/** `icon` is a heroicon name (for example `heroPencil`); an unknown name falls back to the label initial. */
export interface ToolbarTool {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly disabled?: boolean;
  /** Display-only hint appended to the tooltip, for example `V`. */
  readonly shortcutLabel?: string;
}

/** `hex` is the data colour of the mark, painted on the swatch; it is not UI styling. */
export interface ToolbarColour {
  readonly id: string;
  readonly label: string;
  readonly hex: string;
}

export interface ToolbarWidth {
  readonly id: string;
  readonly label: string;
  /** Stroke width in pixels, drawn as a sample bar on the button. */
  readonly px: number;
}

export interface AnnotationToolbarViewModel {
  readonly tools: readonly ToolbarTool[];
  readonly selectedToolId?: string;
  readonly colours: readonly ToolbarColour[];
  readonly selectedColourId?: string;
  readonly widths: readonly ToolbarWidth[];
  readonly selectedWidthId?: string;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  /** Supplied display text such as `100%`; the toolbar owns no zoom state. */
  readonly zoomLabel: string;
  readonly canSave: boolean;
  readonly saveLabel?: string;
  /** Disables everything except zoom. */
  readonly readOnly?: boolean;
  /** Disables the four zoom buttons (the host has locked pan and zoom). */
  readonly zoomLocked?: boolean;
}

export type AnnotationToolbarIntent =
  | { readonly type: 'toolSelected'; readonly toolId: string }
  | { readonly type: 'colourSelected'; readonly colourId: string }
  | { readonly type: 'widthSelected'; readonly widthId: string }
  | { readonly type: 'undoRequested' }
  | { readonly type: 'redoRequested' }
  | { readonly type: 'zoomInRequested' }
  | { readonly type: 'zoomOutRequested' }
  | { readonly type: 'zoomFitRequested' }
  | { readonly type: 'zoomResetRequested' }
  | { readonly type: 'saveRequested' };

export interface EmrAnnotationToolbarLabels {
  readonly toolbarAria?: string;
  readonly toolsGroup?: string;
  readonly penGroup?: string;
  readonly penPrefix?: string;
  readonly penFallback?: string;
  readonly penPanelAria?: string;
  readonly colourGroup?: string;
  readonly widthGroup?: string;
  readonly historyGroup?: string;
  readonly undo?: string;
  readonly redo?: string;
  readonly zoomGroup?: string;
  readonly zoomOut?: string;
  readonly zoomIn?: string;
  readonly zoomFit?: string;
  readonly zoomReset?: string;
  readonly zoomResetAria?: (zoomLabel: string) => string;
  readonly saveGroup?: string;
  readonly save?: string;
}

export function canSelectToolbarTool(
  model: Pick<AnnotationToolbarViewModel, 'readOnly' | 'tools'>,
  toolId: string,
): boolean {
  if (model.readOnly) return false;
  return model.tools.some((tool) => tool.id === toolId && !tool.disabled);
}

export function canOpenToolbarPen(
  model: Pick<AnnotationToolbarViewModel, 'readOnly' | 'colours' | 'widths'>,
): boolean {
  return !model.readOnly && (model.colours.length > 0 || model.widths.length > 0);
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

export function resolveAnnotationToolbarPanelId(
  idPrefix = '',
  headingId?: string | null,
  fallbackId = 'emr-tb-pen-panel',
): string {
  const prefix = idPrefix.trim().replace(/-+$/, '');
  if (prefix) return `${prefix}-emr-tb-pen-panel`;
  const heading = headingId?.trim();
  if (heading) return `${heading}-pen-panel`;
  return fallbackId;
}
