// @vitest-environment jsdom
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => import('react-native-web'));

import type { EmrDataTableIntent, EmrDataTableModel } from '@drguptavivek/emr-controller';
import { EmrDataTable } from './data-table.web';

describe('EmrDataTable (React Web)', () => {
  const baseModel: EmrDataTableModel = {
    caption: 'Referral registry',
    columns: [
      { id: 'patient', label: 'Patient', sortable: true, width: 180 },
      { id: 'status', label: 'Status', width: '25%' },
    ],
    rows: [
      {
        id: 'r1',
        cells: {
          patient: 'Meera Nair',
          status: { text: 'Cataract', badge: { label: 'Overdue', tone: 'warning' } },
        },
      },
      {
        id: 'r2',
        cells: {
          patient: 'Rohan Iyer',
          status: { text: 'Glaucoma', badge: { label: 'Booked', tone: 'info' } },
        },
      },
    ],
    selectedIds: ['r1'],
    sort: { columnId: 'patient', direction: 'asc' },
    filters: [{ id: 'f1', label: 'Status', valueLabel: 'Overdue' }],
    savedFilters: [{ id: 'sf1', label: 'Overdue > 14 days' }],
    bulkActions: [{ id: 'assign', label: 'Assign' }],
    density: 'comfortable',
    page: 1,
    pageCount: 3,
    pageSize: 10,
    pageSizeOptions: [5, 10, 25],
    summaryLabel: 'Showing 1-2 of 24',
    status: 'ready',
  };

  it('renders monochrome SVG icons, EmrBadgeView, deterministic headingId/idPrefix, print hooks, and container query', () => {
    const html = renderToStaticMarkup(
      createElement(EmrDataTable, {
        model: baseModel,
        idPrefix: 'ward-a',
        headingId: 'custom-table-caption',
        onIntent: () => {},
      }),
    );

    expect(html).toContain('id="ward-a-emr-data-table"');
    expect(html).toContain('id="custom-table-caption"');
    expect(html).toContain('aria-labelledby="custom-table-caption"');
    expect(html).toContain('width:180px');
    expect(html).toContain('width:25%');
    expect(html).toContain('<svg');
    expect(html).toContain('data-emr-print="hide"');
    expect(html).toContain('container-type: inline-size');
    expect(html).toContain('Overdue');
    expect(html).not.toContain('×');
    expect(html).not.toContain('▲');
    expect(html).not.toContain('▼');
    expect(html).not.toContain('↕');
  });

  it('renders a 5-row loading skeleton with aria-busy=true and empty/error states', () => {
    const loadingHtml = renderToStaticMarkup(
      createElement(EmrDataTable, {
        model: { ...baseModel, status: 'loading' },
        onIntent: () => {},
      }),
    );
    expect(loadingHtml).toContain('aria-busy="true"');
    expect((loadingHtml.match(/aria-hidden="true"/g) ?? []).length).toBeGreaterThanOrEqual(5);

    const errorHtml = renderToStaticMarkup(
      createElement(EmrDataTable, {
        model: { ...baseModel, status: 'error', error: 'Network timeout' },
        onIntent: () => {},
      }),
    );
    expect(errorHtml).toContain('role="alert"');
    expect(errorHtml).toContain('Network timeout');
    expect(errorHtml).toContain('Retry');

    const emptyHtml = renderToStaticMarkup(
      createElement(EmrDataTable, {
        model: { ...baseModel, rows: [] },
        onIntent: () => {},
      }),
    );
    expect(emptyHtml).toContain('No rows to show');
  });

  it('supports Saved Filters outside-click & keyboard nav, readOnly gating, and focus/blur lifecycle', () => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement('div');
    document.body.append(host);
    const intents: EmrDataTableIntent[] = [];
    let focusCount = 0;
    let blurCount = 0;
    const root = createRoot(host);

    act(() => {
      root.render(
        createElement(EmrDataTable, {
          model: baseModel,
          idPrefix: 'ward-b',
          onIntent: (i) => intents.push(i),
          onFocus: () => {
            focusCount += 1;
          },
          onBlur: () => {
            blurCount += 1;
          },
        }),
      );
    });

    // Open saved filters menu with ArrowDown and navigate with ArrowDown/Escape
    const trigger = host.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]')!;
    act(() => {
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });
    const items = [...host.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];
    expect(items).toHaveLength(2);
    expect(document.activeElement).toBe(items[0]);

    act(() => {
      items[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });
    expect(document.activeElement).toBe(items[1]);

    // Outside pointerdown closes menu
    act(() => {
      document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    });
    expect(host.querySelector('[role="menu"]')).toBeNull();

    // Focus/blur lifecycle
    const rootDiv = host.querySelector<HTMLElement>('#ward-b-emr-data-table')!;
    act(() => {
      rootDiv.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      rootDiv.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: trigger }));
    });
    expect(focusCount).toBe(1);
    expect(blurCount).toBe(0);
    act(() => {
      rootDiv.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    });
    expect(blurCount).toBe(1);

    // Re-render in readOnly mode: selection/filter-mutation blocked, sort/pagination still emit
    act(() => {
      root.render(
        createElement(EmrDataTable, {
          model: { ...baseModel, readOnly: true },
          idPrefix: 'ward-b',
          onIntent: (i) => intents.push(i),
        }),
      );
    });

    const addFilterBtn = [...host.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === 'Add filter')!;
    const removeFilterBtn = host.querySelector<HTMLButtonElement>('button[aria-label^="Remove filter"]')!;
    const bulkBtn = [...host.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === 'Assign')!;
    const rowCheckbox = host.querySelector<HTMLInputElement>('tbody input[type="checkbox"]')!;
    const sortBtn = host.querySelector<HTMLButtonElement>('th button')!;
    const nextBtn = [...host.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === 'Next')!;

    act(() => {
      addFilterBtn.click();
      removeFilterBtn.click();
      bulkBtn.click();
      rowCheckbox.click();
      sortBtn.click();
      nextBtn.click();
    });

    expect(intents).toEqual([
      { type: 'sortChanged', columnId: 'patient', direction: 'desc' },
      { type: 'pageChanged', page: 2 },
    ]);

    act(() => {
      root.unmount();
    });
    host.remove();
  });
});
