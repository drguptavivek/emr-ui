// @vitest-environment jsdom
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => import('react-native-web'));

import type {
  AnnotationListIntent,
  AnnotationListViewModel,
  AnnotationToolbarIntent,
  AnnotationToolbarViewModel,
  ImageTemplatePickerIntent,
  ImageTemplatePickerViewModel,
} from '@drguptavivek/emr-controller';
import { EmrAnnotationList, EmrAnnotationToolbar, EmrImageTemplatePicker } from './l3-annotation';
import { EmrThemeProvider } from './theme';

const RAW_EMOJI_PATTERN = /[\u{1F512}\u{1F513}\u{1F441}\u{1F5D1}★☆✕✓]/u;

describe('EmrAnnotationToolbar & EmrAnnotationList (React)', () => {
  const baseToolbar: AnnotationToolbarViewModel = {
    tools: [
      { id: 'select', label: 'Select', icon: 'heroCursorArrowRays', shortcutLabel: 'V' },
      { id: 'line', label: 'Line', icon: 'shape-line', shortcutLabel: 'L' },
      { id: 'lockedTool', label: 'Locked tool', icon: 'shape-rect', disabled: true },
    ],
    selectedToolId: 'line',
    colours: [
      { id: 'red', label: 'Red', hex: '#d92d20' },
      { id: 'blue', label: 'Blue', hex: '#1d4ed8' },
    ],
    selectedColourId: 'red',
    widths: [
      { id: 'w1', label: 'Thin 1px', px: 1 },
      { id: 'w2', label: 'Medium 3px', px: 3 },
    ],
    selectedWidthId: 'w2',
    canUndo: true,
    canRedo: false,
    zoomLabel: '100%',
    canSave: true,
    saveLabel: 'Save sketch',
  };

  const baseList: AnnotationListViewModel = {
    items: [
      {
        layer: {
          id: 'l1',
          label: 'RNFL defect',
          color: '#d92d20',
          strokeWidth: 3,
          visible: true,
          tool: 'circle',
          center: { x: 0.4, y: 0.5 },
          radiusX: 0.1,
          radiusY: 0.1,
        },
        number: 1,
        classLabel: 'Lesion',
        locked: true,
      },
      {
        layer: {
          id: 'l2',
          label: 'Haemorrhage',
          color: '#1d4ed8',
          strokeWidth: 3,
          visible: false,
          tool: 'line',
          points: [
            { x: 0.2, y: 0.2 },
            { x: 0.3, y: 0.3 },
          ],
        },
        number: 2,
        description: '7 o’clock disc margin',
      },
    ],
    selectedLayerId: 'l2',
    emptyMessage: 'No annotations yet.',
    canLock: true,
  };

  it('renders EmrAnnotationToolbar with monochrome SVGs, aria-controls, idPrefix, print hide, zero disabled attr, and >=44px floor in compact density', () => {
    const html = renderToStaticMarkup(
      createElement(
        EmrThemeProvider,
        { tokens: { controlHeight: 36 } },
        createElement(EmrAnnotationToolbar, {
          model: baseToolbar,
          idPrefix: 'opd',
          headingId: 'tb-head',
          labels: { undo: 'Revert step' },
          onIntent: () => {},
        }),
      ),
    );

    expect(html).not.toMatch(RAW_EMOJI_PATTERN);
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('role="toolbar"');
    expect(html).toContain('aria-labelledby="tb-head"');
    expect(html).toContain('aria-controls="opd-emr-tb-pen-panel"');
    expect(html).toContain('data-emr-print="hide"');
    expect(html).toContain('<svg');
    expect(html).toContain('min-width:44px');
    expect(html).toContain('min-height:44px');
    expect(html).toContain('aria-label="Revert step"');
  });

  it('handles toolbar intents, Pen popover Escape/outside-click close, guards, and onFocus/onBlur', () => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement('div');
    document.body.append(host);
    const intents: AnnotationToolbarIntent[] = [];
    let focusCount = 0;
    let blurCount = 0;
    const root = createRoot(host);

    const render = (model: AnnotationToolbarViewModel) => {
      act(() => {
        root.render(
          createElement(EmrAnnotationToolbar, {
            model,
            idPrefix: 'tb',
            onIntent: (i) => intents.push(i),
            onFocus: () => { focusCount += 1; },
            onBlur: () => { blurCount += 1; },
          }),
        );
      });
    };

    render(baseToolbar);

    // Disabled tool & !canRedo are aria-disabled and guarded (component exposes zero disabled prop)
    const lockedBtn = host.querySelector<HTMLElement>('[aria-label="Locked tool"]')!;
    expect(lockedBtn.getAttribute('aria-disabled')).toBe('true');
    act(() => { lockedBtn.click(); });
    const redoBtn = host.querySelector<HTMLElement>('[aria-label="Redo"]')!;
    expect(redoBtn.getAttribute('aria-disabled')).toBe('true');
    act(() => { redoBtn.click(); });
    expect(intents).toEqual([]);

    // Valid tool & undo
    act(() => {
      host.querySelector<HTMLElement>('[aria-label="Select"]')!.click();
      host.querySelector<HTMLElement>('[aria-label="Undo"]')!.click();
    });
    expect(intents).toEqual([
      { type: 'toolSelected', toolId: 'select' },
      { type: 'undoRequested' },
    ]);

    // Pen popover opens, closes on Escape and returns focus
    const penBtn = host.querySelector<HTMLElement>('button[aria-controls], [role="button"][aria-controls]')!;
    act(() => { penBtn.click(); });
    expect(host.querySelector('#tb-emr-tb-pen-panel')).not.toBeNull();
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(host.querySelector('#tb-emr-tb-pen-panel')).toBeNull();

    // Pen popover closes on outside pointerdown
    act(() => { penBtn.click(); });
    expect(host.querySelector('#tb-emr-tb-pen-panel')).not.toBeNull();
    act(() => {
      document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    });
    expect(host.querySelector('#tb-emr-tb-pen-panel')).toBeNull();

    // Focus/blur boundary
    const selectBtn = host.querySelector<HTMLElement>('[aria-label="Select"]')!;
    act(() => {
      selectBtn.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });
    expect(focusCount).toBe(1);
    act(() => {
      selectBtn.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    });
    expect(blurCount).toBe(1);

    // readOnly + zoomLocked guard
    render({ ...baseToolbar, readOnly: true, zoomLocked: true });
    act(() => {
      host.querySelector<HTMLElement>('[aria-label="Select"]')!.click();
      host.querySelector<HTMLElement>('[aria-label="Zoom in"]')!.click();
      host.querySelector<HTMLElement>('[aria-label="Save sketch"]')!.click();
    });
    expect(intents).toHaveLength(2);

    act(() => { root.unmount(); });
    host.remove();
  });

  it('renders EmrAnnotationList with monochrome SVGs, aria-current="true", idPrefix, print attributes, and zero emojis/disabled', () => {
    const html = renderToStaticMarkup(
      createElement(
        EmrThemeProvider,
        { tokens: { controlHeight: 36 } },
        createElement(EmrAnnotationList, {
          model: baseList,
          idPrefix: 'eye',
          headingId: 'marks-h',
          onIntent: () => {},
        }),
      ),
    );

    expect(html).not.toMatch(RAW_EMOJI_PATTERN);
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('id="eye-emr-annotation-list"');
    expect(html).toContain('id="eye-al-row-l1"');
    expect(html).toContain('aria-labelledby="marks-h"');
    expect(html).toContain('aria-current="true"');
    expect(html).toContain('data-emr-print="hide"');
    expect(html).toContain('break-inside:avoid');
    expect(html).toContain('<svg');
    expect(html).toContain('min-height:44px');
  });

  it('enforces list handler guards for locked layers, bounds, readOnly, and fires onFocus/onBlur', () => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement('div');
    document.body.append(host);
    const intents: AnnotationListIntent[] = [];
    let focusCount = 0;
    let blurCount = 0;
    const root = createRoot(host);

    const render = (model: AnnotationListViewModel) => {
      act(() => {
        root.render(
          createElement(EmrAnnotationList, {
            model,
            idPrefix: 'al',
            onIntent: (i) => intents.push(i),
            onFocus: () => { focusCount += 1; },
            onBlur: () => { blurCount += 1; },
          }),
        );
      });
    };

    render(baseList);

    // Locked l1 delete button is aria-disabled and guarded; print hooks unwrap text
    const delL1 = host.querySelector<HTMLElement>('[aria-label="Delete drawing 1, Lesion"]')!;
    expect(delL1.getAttribute('aria-disabled')).toBe('true');
    act(() => { delL1.click(); });
    expect(intents).toEqual([]);

    // Move down on last item l2 is aria-disabled and guarded; move up emits
    const downL2 = host.querySelector<HTMLElement>('[aria-label="Move drawing 2 down, Haemorrhage"]')!;
    expect(downL2.getAttribute('aria-disabled')).toBe('true');
    expect(host.querySelector('[data-emr-print="legend-row"]')).not.toBeNull();
    expect(host.querySelector('[data-emr-print="unwrap"]')).not.toBeNull();
    act(() => { downL2.click(); });
    const upL2 = host.querySelector<HTMLElement>('[aria-label="Move drawing 2 up, Haemorrhage"]')!;
    act(() => { upL2.click(); });
    expect(intents).toEqual([{ type: 'layerMoveRequested', layerId: 'l2', direction: 'up' }]);

    // readOnly keeps selection active and hides actions
    render({ ...baseList, readOnly: true });
    expect(host.querySelector('[data-emr-print="hide"]')).toBeNull();
    const row1Btn = host.querySelector<HTMLElement>('#al-al-row-l1 [role="button"]')!;
    act(() => { row1Btn.click(); });
    expect(intents).toEqual([
      { type: 'layerMoveRequested', layerId: 'l2', direction: 'up' },
      { type: 'layerSelected', layerId: 'l1' },
    ]);

    act(() => {
      row1Btn.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });
    expect(focusCount).toBe(1);
    act(() => {
      row1Btn.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    });
    expect(blurCount).toBe(1);

    act(() => { root.unmount(); });
    host.remove();
  });

  const basePicker: ImageTemplatePickerViewModel = {
    title: 'Choose an outline',
    options: [
      { id: 'r-od', label: 'Retina OD', imageUrl: '/r-od.svg', width: 120, height: 120, groupId: 'retina', badges: ['Right'] },
      { id: 'r-os', label: 'Retina OS', imageUrl: '/r-os.svg', width: 120, height: 120, groupId: 'retina', badges: ['Left'] },
      { id: 'c-od', label: 'Cornea OD', imageUrl: '/c-od.svg', width: 120, height: 120, groupId: 'cornea', badges: ['Right'] },
    ],
    groups: [
      { id: 'retina', label: 'Retina', count: 2 },
      { id: 'cornea', label: 'Cornea', count: 1 },
    ],
    query: 'right',
    selectedId: 'r-od',
    totalLabel: '2 of 3 outlines',
    emptyMessage: 'No outlines match.',
    favouriteIds: ['c-od'],
    canEditFavourites: true,
  };

  it('renders EmrImageTemplatePicker with monochrome SVGs, idPrefix, print-hide, CSS grid SSR fallback, >=44px floor, and zero Unicode symbols', () => {
    const html = renderToStaticMarkup(
      createElement(
        EmrThemeProvider,
        { tokens: { controlHeight: 36 } },
        createElement(EmrImageTemplatePicker, {
          model: basePicker,
          idPrefix: 'opd',
          headingId: 'tpl-head',
          labels: { clearSearch: 'Reset search' },
          onIntent: () => {},
        }),
      ),
    );

    expect(html).not.toMatch(RAW_EMOJI_PATTERN);
    expect(html).toContain('id="opd-emr-image-template-picker"');
    expect(html).toContain('aria-labelledby="tpl-head"');
    expect(html).toContain('data-emr-print="hide"');
    expect(html).toContain('grid-template-columns:repeat(auto-fill');
    expect(html).toContain('<svg');
    expect(html).toContain('min-height:44px');
    expect(html).toContain('aria-label="Reset search"');
  });

  it('handles EmrImageTemplatePicker intents, Escape clearing/closing, readOnly guards, empty recovery, and onFocus/onBlur', () => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement('div');
    document.body.append(host);
    const intents: ImageTemplatePickerIntent[] = [];
    let focusCount = 0;
    let blurCount = 0;
    const root = createRoot(host);

    const render = (model: ImageTemplatePickerViewModel, readOnly?: boolean) => {
      act(() => {
        root.render(
          createElement(EmrImageTemplatePicker, {
            model,
            idPrefix: 'tp',
            readOnly,
            onIntent: (i) => intents.push(i),
            onFocus: () => { focusCount += 1; },
            onBlur: () => { blurCount += 1; },
          }),
        );
      });
    };

    render(basePicker);

    const region = host.querySelector<HTMLElement>('#tp-emr-image-template-picker')!;
    expect(region).not.toBeNull();

    // Clear search button emits queryChangeRequested: ''
    act(() => {
      host.querySelector<HTMLElement>('[aria-label="Clear search"]')!.click();
    });
    expect(intents[0]).toEqual({ type: 'queryChangeRequested', query: '' });

    // Escape clears active search query
    act(() => {
      region.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(intents[1]).toEqual({ type: 'queryChangeRequested', query: '' });

    // Escape closes when query is empty
    render({ ...basePicker, query: '' });
    act(() => {
      region.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(intents[2]).toEqual({ type: 'closeRequested' });

    // Tile selection and favourite toggle emit when interactive
    act(() => {
      host.querySelector<HTMLElement>('[aria-label="Retina OS, Left"]')!.click();
      host.querySelector<HTMLElement>('[aria-label="Add Retina OS to favourites"]')!.click();
    });
    expect(intents.slice(3)).toEqual([
      { type: 'templateSelected', templateId: 'r-os' },
      { type: 'favouriteToggleRequested', templateId: 'r-os', favourite: true },
    ]);

    // readOnly blocks tile selection and hides star pins while keeping filter chips & search operable
    const countBeforeReadOnly = intents.length;
    render({ ...basePicker, query: '' }, true);
    const tileBtn = host.querySelector<HTMLElement>('[aria-label="Retina OS, Left"]')!;
    expect(tileBtn.getAttribute('aria-disabled')).toBe('true');
    expect(host.querySelector('[aria-label="Add Retina OS to favourites"]')).toBeNull();
    act(() => {
      tileBtn.click();
    });
    expect(intents).toHaveLength(countBeforeReadOnly);

    act(() => {
      host.querySelector<HTMLElement>('[role="button"][aria-pressed="false"]')!.click();
    });
    expect(intents[countBeforeReadOnly]?.type).toBe('groupSelected');

    // Empty state recovery buttons (Clear search, Show all, Reset filters)
    render({ ...basePicker, options: [], query: 'zzz', selectedGroupId: 'retina' });
    act(() => {
      Array.from(host.querySelectorAll<HTMLElement>('[role="button"]'))
        .find((el) => el.textContent?.includes('Reset filters'))!
        .click();
    });
    expect(intents.slice(countBeforeReadOnly + 1)).toEqual([
      { type: 'queryChangeRequested', query: '' },
      { type: 'groupSelected', groupId: null },
    ]);

    // Focus/blur boundary + Escape directly on searchbox clears query then requests close
    render({ ...basePicker, query: 'Fundus' });
    const searchbox = host.querySelector<HTMLInputElement>('input[role="searchbox"]')!;
    act(() => {
      searchbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(intents[intents.length - 1]).toEqual({ type: 'queryChangeRequested', query: '' });

    render({ ...basePicker, query: '' });
    act(() => {
      host.querySelector<HTMLInputElement>('input[role="searchbox"]')!
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(intents[intents.length - 1]).toEqual({ type: 'closeRequested' });

    const closeBtn = host.querySelector<HTMLElement>('[aria-label="Close"]')!;
    act(() => {
      closeBtn.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });
    expect(focusCount).toBe(1);
    act(() => {
      closeBtn.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    });
    expect(blurCount).toBe(1);

    act(() => { root.unmount(); });
    host.remove();
  });
});
