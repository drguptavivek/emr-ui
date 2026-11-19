import { describe, expect, it } from 'vitest';
import {
  canOpenToolbarPen,
  canSelectToolbarTool,
  canTriggerToolbarIntent,
  resolveAnnotationToolbarPanelId,
  type AnnotationToolbarViewModel,
} from './annotation-toolbar.models.js';
import {
  canMoveAnnotationLayer,
  canRemoveAnnotationLayer,
  canToggleAnnotationLayerLock,
  canToggleAnnotationLayerVisibility,
  canTriggerAnnotationListIntent,
  resolveAnnotationListId,
  type AnnotationListViewModel,
} from './annotation-list.models.js';

describe('annotation-toolbar & annotation-list controller contracts', () => {
  const toolbarModel: AnnotationToolbarViewModel = {
    tools: [
      { id: 'select', label: 'Select', icon: 'heroCursorArrowRays' },
      { id: 'line', label: 'Line', icon: 'shape-line', disabled: true },
    ],
    selectedToolId: 'select',
    colours: [{ id: 'red', label: 'Red', hex: '#d92d20' }],
    selectedColourId: 'red',
    widths: [{ id: 'w2', label: 'Medium', px: 3 }],
    selectedWidthId: 'w2',
    canUndo: true,
    canRedo: false,
    zoomLabel: '100%',
    canSave: true,
  };

  it('guards toolbar intents against readOnly, disabled tools, undo/redo/save flags, and zoomLocked', () => {
    expect(canSelectToolbarTool(toolbarModel, 'select')).toBe(true);
    expect(canSelectToolbarTool(toolbarModel, 'line')).toBe(false);
    expect(canSelectToolbarTool(toolbarModel, 'missing')).toBe(false);
    expect(canOpenToolbarPen(toolbarModel)).toBe(true);
    expect(canTriggerToolbarIntent(toolbarModel, { type: 'undoRequested' })).toBe(true);
    expect(canTriggerToolbarIntent(toolbarModel, { type: 'redoRequested' })).toBe(false);
    expect(canTriggerToolbarIntent(toolbarModel, { type: 'saveRequested' })).toBe(true);
    expect(canTriggerToolbarIntent(toolbarModel, { type: 'zoomInRequested' })).toBe(true);

    const readOnlyToolbar: AnnotationToolbarViewModel = {
      ...toolbarModel,
      readOnly: true,
      zoomLocked: true,
    };
    expect(canSelectToolbarTool(readOnlyToolbar, 'select')).toBe(false);
    expect(canOpenToolbarPen(readOnlyToolbar)).toBe(false);
    expect(canTriggerToolbarIntent(readOnlyToolbar, { type: 'undoRequested' })).toBe(false);
    expect(canTriggerToolbarIntent(readOnlyToolbar, { type: 'saveRequested' })).toBe(false);
    expect(canTriggerToolbarIntent(readOnlyToolbar, { type: 'zoomInRequested' })).toBe(false);

    expect(resolveAnnotationToolbarPanelId('clinic-', 'h1')).toBe('clinic-emr-tb-pen-panel');
    expect(resolveAnnotationToolbarPanelId('', 'h1')).toBe('h1-pen-panel');
    expect(resolveAnnotationToolbarPanelId()).toBe('emr-tb-pen-panel');
  });

  it('guards list intents against readOnly, canLock, bounds, and locked layers', () => {
    const listModel: AnnotationListViewModel = {
      items: [
        {
          layer: {
            id: 'l1',
            label: 'Lesion',
            color: '#d92d20',
            strokeWidth: 3,
            visible: true,
            tool: 'circle',
            center: { x: 0.5, y: 0.5 },
            radiusX: 0.1,
            radiusY: 0.1,
          },
          number: 1,
          locked: true,
        },
        {
          layer: {
            id: 'l2',
            label: 'Incision',
            color: '#1d4ed8',
            strokeWidth: 3,
            visible: true,
            tool: 'line',
            points: [
              { x: 0.1, y: 0.1 },
              { x: 0.2, y: 0.2 },
            ],
          },
          number: 2,
          locked: false,
        },
      ],
      selectedLayerId: 'l2',
      emptyMessage: 'No layers',
      canLock: true,
    };

    expect(canToggleAnnotationLayerVisibility(listModel, 'l1')).toBe(true);
    expect(canToggleAnnotationLayerLock(listModel, 'l1')).toBe(true);
    expect(canMoveAnnotationLayer(listModel, 'l1', 'down')).toBe(false); // locked
    expect(canRemoveAnnotationLayer(listModel, 'l1')).toBe(false); // locked
    expect(canMoveAnnotationLayer(listModel, 'l2', 'up')).toBe(true);
    expect(canMoveAnnotationLayer(listModel, 'l2', 'down')).toBe(false); // last
    expect(canRemoveAnnotationLayer(listModel, 'l2')).toBe(true);

    const readOnlyList: AnnotationListViewModel = { ...listModel, readOnly: true, canLock: false };
    expect(canTriggerAnnotationListIntent(readOnlyList, { type: 'layerSelected', layerId: 'l1' })).toBe(true);
    expect(canTriggerAnnotationListIntent(readOnlyList, { type: 'layerVisibilityToggleRequested', layerId: 'l1' })).toBe(false);
    expect(canTriggerAnnotationListIntent(readOnlyList, { type: 'layerLockToggleRequested', layerId: 'l1' })).toBe(false);
    expect(canTriggerAnnotationListIntent(readOnlyList, { type: 'layerMoveRequested', layerId: 'l2', direction: 'up' })).toBe(false);
    expect(canTriggerAnnotationListIntent(readOnlyList, { type: 'layerRemoveRequested', layerId: 'l2' })).toBe(false);

    expect(resolveAnnotationListId('opd-', 'marks-h')).toBe('opd-emr-annotation-list');
    expect(resolveAnnotationListId('', 'marks-h')).toBe('marks-h-list');
    expect(resolveAnnotationListId()).toBe('emr-annotation-list');
  });
});
