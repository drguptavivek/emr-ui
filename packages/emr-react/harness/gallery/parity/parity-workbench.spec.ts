// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { EmrThemeProvider } from '../../../src';
import { EMR_REGISTRY_MANIFEST } from '../registry-manifest';
import { PARITY_BY_SELECTOR, PARITY_ENTRIES } from './index';
import { ParityWorkbench } from './parity-workbench';

vi.mock('react-native', () => import('react-native-web'));
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);

describe('ParityWorkbench catalog coverage', () => {
  const manifestSelectors = EMR_REGISTRY_MANIFEST.items
    .flatMap((item) =>
      'lit' in item && item.lit && 'selector' in item.lit && typeof item.lit.selector === 'string' && item.lit.selector.length > 0
        ? [item.lit.selector]
        : [],
    );

  it('covers 100% of the 171 catalog selectors with no duplicates or orphans', () => {
    expect(manifestSelectors.length).toBe(171);
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const entry of PARITY_ENTRIES) {
      if (seen.has(entry.selector)) {
        duplicates.push(entry.selector);
      }
      seen.add(entry.selector);
    }
    expect(duplicates).toEqual([]);

    const missing = manifestSelectors.filter((sel) => !PARITY_BY_SELECTOR.has(sel));
    expect(missing).toEqual([]);

    const manifestSet = new Set(manifestSelectors);
    const orphans = PARITY_ENTRIES.map((e) => e.selector).filter((sel) => !manifestSet.has(sel));
    expect(orphans).toEqual([]);
    expect(PARITY_ENTRIES.length).toBe(manifestSelectors.length);
  });

  it('marks application and encounter shell surfaces as shells', () => {
    const shellSelectors = PARITY_ENTRIES.filter((e) => e.shell).map((e) => e.selector);
    expect(shellSelectors).toContain('emr-app-shell');
    expect(shellSelectors).toContain('emr-top-bar');
    expect(shellSelectors).toContain('emr-left-nav');
    expect(shellSelectors).toContain('emr-right-flyout');
    expect(shellSelectors).toContain('emr-sheet');
    expect(shellSelectors).toContain('emr-bottom-tab-bar');
    expect(shellSelectors).toContain('emr-patient-banner');
    expect(shellSelectors.length).toBeGreaterThanOrEqual(9);
  });

  it('initializes state and builds both React and Lit element trees for all 171 descriptors', () => {
    for (const entry of PARITY_ENTRIES) {
      const state = entry.createInitialState();
      try {
        const ctx = {
          state,
          readOnly: false,
          update: () => {},
        };
        const reactTree = entry.renderReact(ctx);
        const litTree = entry.renderLit(ctx);
        expect(reactTree, `renderReact(${entry.selector})`).toBeTruthy();
        expect(litTree, `renderLit(${entry.selector})`).toBeTruthy();
      } finally {
        const maybeCtrl = state as { controller?: { destroy?: () => void }; destroy?: () => void } | null;
        maybeCtrl?.controller?.destroy?.();
        maybeCtrl?.destroy?.();
      }
    }
  });

  it('renders the side-by-side ParityWorkbench and switches active components', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    try {
      await act(() => {
        root.render(createElement(EmrThemeProvider, { scheme: 'light', children: createElement(ParityWorkbench) }));
      });

      expect(container.textContent).toContain('Catalog Navigator (171 / 171)');
      expect(container.textContent).toContain('React · @drguptavivek/emr-react');
      expect(container.textContent).toContain('Lit · @drguptavivek/emr-elements');
      expect(container.textContent).toContain('<emr-prescribing-table>');

      const appShellBtn = [...container.querySelectorAll<HTMLElement>('[role="button"]')].find((el) =>
        el.textContent?.includes('<emr-app-shell>'),
      );
      expect(appShellBtn).toBeTruthy();
      await act(() => {
        appShellBtn!.click();
      });

      expect(container.textContent).toContain('EmrAppShell');
      expect(container.textContent).toContain('<EmrAppShell />');
    } finally {
      await act(() => {
        root.unmount();
      });
      container.remove();
    }
  });
});
