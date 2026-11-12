// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PrescribingTableDemo } from './l4-medications';

vi.mock('react-native', () => import('react-native-web'));
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('keeps the Salbutamol formulary selection as needed without a morning schedule', async () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const button = (name: string) =>
    [...container.querySelectorAll<HTMLElement>('[role="button"]')]
      .find((el) => el.textContent?.trim() === name);
  try {
    await act(() => root.render(createElement(PrescribingTableDemo)));
    const medicine = container.querySelector<HTMLInputElement>('input[aria-label="Row 1 medicine name"]')!;
    await act(() => medicine.focus());
    await act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(medicine, 'Salbutamol');
      medicine.dispatchEvent(new Event('input', { bubbles: true }));
    });

    expect(container.textContent).toContain('Searching formulary…');
    await act(() => vi.advanceTimersByTimeAsync(200));
    expect(container.textContent).toContain('Fixture-backed formulary');
    const suggestion = [...container.querySelectorAll<HTMLElement>('[role="button"]')]
      .find((el) => el.textContent?.includes('RXN-745679'))!;
    await act(() => suggestion.click());

    expect(medicine.value).toBe('Salbutamol MDI');
    expect(button('SOS')?.getAttribute('aria-pressed')).toBe('true');
    expect(button('OD')?.getAttribute('aria-pressed')).toBe('false');
    expect(container.querySelectorAll('[aria-label^="Morning slot:"]')).toHaveLength(2);

    await act(() => button('OD')!.click());
    expect(button('OD')?.getAttribute('aria-pressed')).toBe('true');
    expect(button('SOS')?.getAttribute('aria-pressed')).toBe('false');
  } finally {
    await act(() => root.unmount());
    container.remove();
  }
});

it('replaces previous results with an empty state for a new query', async () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(() => root.render(createElement(PrescribingTableDemo)));
    const medicine = container.querySelector<HTMLInputElement>('input[aria-label="Row 1 medicine name"]')!;
    await act(() => medicine.focus());
    const enter = async (value: string) => act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(medicine, value);
      medicine.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await enter('Salbutamol');
    await act(() => vi.advanceTimersByTimeAsync(200));
    expect(container.textContent).toContain('RXN-745679');
    await enter('no matching medicine');
    await act(() => vi.advanceTimersByTimeAsync(200));
    expect(container.textContent).toContain('No formulary results.');
    expect(container.textContent).not.toContain('RXN-745679');
  } finally {
    await act(() => root.unmount());
    container.remove();
  }
});
