// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { EMR_CATALOG } from '../../emr-ui/catalog.manifest';
import { slugForEntry } from '../../../scripts/build-registry.mjs';
import {
  EMR_DENSITY_MAP,
  EMR_FONT_STACKS,
  EMR_PALETTE_PRESETS,
  EMR_RADIUS_MAP,
  EmrPrescribingTableElement,
  registerAllEmrElements,
  resolveEmrThemeVariables,
} from './index.js';

describe('@drguptavivek/emr-elements (Lit v3 Web Components)', () => {
  it('registers a custom element in customElements for every L1–L6 catalog component plus emr-theme-customizer', () => {
    registerAllEmrElements();
    for (const entry of EMR_CATALOG) {
      const tag = slugForEntry(entry);
      const ctor = customElements.get(tag);
      expect(ctor, `Expected <${tag}> (${entry.id}) to be registered in customElements`).toBeDefined();
    }
    expect(customElements.get('emr-theme-customizer')).toBeDefined();
  });

  it('resolves end-user theme & typography customization variables across palettes, radii, densities, and font stacks', () => {
    const vars = resolveEmrThemeVariables({
      preset: 'surgical-teal',
      scheme: 'light',
      radius: 'soft',
      density: 'compact',
      fontStack: 'atkinson',
      fontScale: '1.1',
    });
    expect(vars['--emr-primary']).toBe(EMR_PALETTE_PRESETS['surgical-teal'].light.primary);
    expect(vars['--emr-radius']).toBe(`${EMR_RADIUS_MAP.soft.px}px`);
    expect(vars['--emr-control-height']).toBe(`${EMR_DENSITY_MAP.compact.heightPx}px`);
    expect(vars['--emr-font-family']).toBe(EMR_FONT_STACKS.atkinson.sans);
    expect(vars['--emr-text-md']).toBe('0.9625rem');
  });

  it('instantiates <emr-prescribing-table> and emits typed intents via emitIntent', () => {
    const el = document.createElement('emr-prescribing-table') as EmrPrescribingTableElement;
    expect(el).toBeInstanceOf(EmrPrescribingTableElement);
    const received: unknown[] = [];
    el.addEventListener('intent', (e: Event) => {
      received.push((e as CustomEvent).detail);
    });
    el.emitIntent({ type: 'rowMoveRequested', rowId: 'rx-1', direction: 'up' });
    el.emitIntent({ type: 'rowInsertBelowRequested', afterRowId: 'rx-1' });
    el.emitIntent({ type: 'rowRemoveRequested', rowId: 'rx-1' });
    expect(received).toEqual([
      { type: 'rowMoveRequested', rowId: 'rx-1', direction: 'up' },
      { type: 'rowInsertBelowRequested', afterRowId: 'rx-1' },
      { type: 'rowRemoveRequested', rowId: 'rx-1' },
    ]);
  });
});
