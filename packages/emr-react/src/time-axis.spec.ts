// @vitest-environment jsdom
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => import('react-native-web'));

import type { TimeAxisIntent, TimeAxisViewModel } from '@drguptavivek/emr-controller';
import { EmrTimeAxis } from './l3-structures';

describe('EmrTimeAxis (React)', () => {
  const baseModel: TimeAxisViewModel = {
    id: 'icu-axis',
    title: 'ICU chart, hourly',
    ticks: [
      { id: 't08', label: '08:00', sublabel: 'Day 1' },
      { id: 't09', label: '09:00', sublabel: 'Day 1', current: true },
      { id: 't10', label: '10:00', sublabel: 'Day 1' },
    ],
    selectedTickId: 't09',
    steps: [
      { id: '60', label: 'Hourly' },
      { id: '30', label: '30 min' },
    ],
    selectedStepId: '60',
    canShiftEarlier: true,
    canShiftLater: false,
  };

  it('renders EmrSelect step chooser, monochrome SVG chevrons, headingId/idPrefix wiring, and print attributes', () => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement('div');
    document.body.append(host);
    const intents: TimeAxisIntent[] = [];
    const root = createRoot(host);

    act(() => {
      root.render(
        createElement(EmrTimeAxis, {
          model: baseModel,
          idPrefix: 'ward-a',
          headingId: 'custom-axis-heading',
          onIntent: (intent) => intents.push(intent),
        }),
      );
    });

    const html = host.innerHTML;
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-labelledby="custom-axis-heading"');
    expect(html).toContain('id="custom-axis-heading"');
    expect(html).toContain('role="combobox"');
    expect(html).toContain('role="listbox"');
    expect(html).toContain('role="option"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('aria-current="time"');
    expect(html).toContain('data-emr-print="hide"');
    expect(html).toContain('data-emr-print="expand"');
    expect(html).toContain('break-inside: avoid');
    expect(html).toContain('<svg');
    expect(html).not.toContain('‹');
    expect(html).not.toContain('›');

    act(() => {
      root.unmount();
    });
    host.remove();
  });

  it('supports keyboard ArrowLeft/ArrowRight/Home/End roving tabindex, ignores ArrowUp/ArrowDown, and emits intents', () => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement('div');
    document.body.append(host);
    const intents: TimeAxisIntent[] = [];
    let focusCount = 0;
    let blurCount = 0;
    const root = createRoot(host);

    act(() => {
      root.render(
        createElement(EmrTimeAxis, {
          model: baseModel,
          idPrefix: 'ward-b',
          onIntent: (intent) => intents.push(intent),
          onFocus: () => {
            focusCount += 1;
          },
          onBlur: () => {
            blurCount += 1;
          },
        }),
      );
    });

    const options = [...host.querySelectorAll<HTMLElement>('[role="option"]')];
    expect(options).toHaveLength(3);
    expect(options.map((el) => el.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);

    act(() => {
      options[1]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    });
    expect(options.map((el) => el.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);

    act(() => {
      options[1]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });
    expect(options.map((el) => el.getAttribute('tabindex'))).toEqual(['-1', '-1', '0']);

    act(() => {
      options[2]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    });
    expect(options.map((el) => el.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);

    act(() => {
      options[0]!.click();
    });
    const earlierBtn = host.querySelector<HTMLElement>('[aria-label="Earlier"]');
    const laterBtn = host.querySelector<HTMLElement>('[aria-label="Later"]');
    act(() => {
      earlierBtn?.click();
      laterBtn?.click(); // disabled because canShiftLater is false
    });

    expect(intents).toEqual([
      { type: 'tickSelected', tickId: 't08' },
      { type: 'shiftEarlierRequested' },
    ]);

    const region = host.querySelector<HTMLElement>('[role="region"]')!;
    act(() => {
      region.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      region.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: options[0]! }));
    });
    expect(focusCount).toBe(1);
    expect(blurCount).toBe(0);

    act(() => {
      region.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    });
    expect(blurCount).toBe(1);

    act(() => {
      root.unmount();
    });
    host.remove();
  });

  it('renders readOnly mode as a focusable list without step chooser or pan buttons', () => {
    const html = renderToStaticMarkup(
      createElement(EmrTimeAxis, {
        model: { ...baseModel, readOnly: true, canShiftLater: true },
        labels: { empty: 'Empty schedule', current: 'Now', selected: 'chosen' },
        onIntent: () => {},
      }),
    );

    expect(html).toContain('role="list"');
    expect(html).toContain('role="listitem"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('Now');
    expect(html).toContain('chosen');
    expect(html).not.toContain('role="combobox"');
    expect(html).not.toContain('role="option"');
    expect(html).not.toContain('Earlier');
    expect(html).not.toContain('Later');
  });
});
