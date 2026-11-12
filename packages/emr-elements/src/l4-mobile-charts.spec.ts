// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import {
  registerL4MobileChartsElements,
  type EmrBarChartElement,
  type EmrBottomTabBarElement,
  type EmrFunnelChartElement,
  type EmrLoginFormElement,
  type EmrPinPadElement,
  type EmrSheetElement,
  type EmrSyncPillElement,
  type EmrToastElement,
  type EmrTopBarElement,
  type EmrTopBarSearchElement,
} from './l4-mobile-charts.js';
import { registerL1Elements } from './l1-primitives.js';

const elements: HTMLElement[] = [];

async function mount<T extends HTMLElement & { updateComplete: Promise<boolean> }>(tag: string, props: Partial<T>) {
  registerL1Elements();
  registerL4MobileChartsElements();
  const el = Object.assign(document.createElement(tag) as T, props);
  elements.push(el);
  document.body.append(el);
  await el.updateComplete;
  const intents: unknown[] = [];
  el.addEventListener('intent', (event) => intents.push((event as CustomEvent).detail));
  return { el, intents };
}

function button(el: HTMLElement, text: string): HTMLButtonElement {
  const match = [...el.shadowRoot!.querySelectorAll('button')].find((item) => item.textContent?.includes(text));
  if (!match) throw new Error(`Missing ${text} button`);
  return match;
}

afterEach(() => {
  for (const el of elements.splice(0)) el.remove();
});

it('distinguishes zero from missing chart values and selects stable IDs', async () => {
  const { el, intents } = await mount<EmrBarChartElement>('emr-bar-chart', { model: {
    title: 'Activity',
    categories: [{ id: 'yes', label: 'Recorded' }, { id: 'no', label: 'Unrecorded' }],
    series: [{ id: 'year', label: 'Year', values: { yes: 0, no: null } }],
  } });
  expect(el.shadowRoot!.textContent).toContain('Recorded · Year: 0');
  expect(el.shadowRoot!.textContent).toContain('Unrecorded · Year: No data');
  button(el, 'Recorded').click();
  expect(intents).toEqual([{ type: 'categorySelected', categoryId: 'yes', seriesId: 'year' }]);

  const funnel = await mount<EmrFunnelChartElement>('emr-funnel-chart', { model: {
    title: 'Flow', steps: [{ id: 'seen', label: 'Seen', value: 4, valueLabel: '4 patients', conversionLabel: 'Half referred' }],
  } });
  button(funnel.el, 'Seen').click();
  expect(funnel.el.shadowRoot!.textContent).toContain('Half referred');
  expect(funnel.intents).toEqual([{ type: 'stepSelected', stepId: 'seen' }]);
});

it('keeps PIN attempts and login credentials with the consumer', async () => {
  const pin = await mount<EmrPinPadElement>('emr-pin-pad', {
    model: { title: 'Unlock', mode: 'unlock', length: 4, digitsEntered: 1 },
  });
  const digit = button(pin.el, '1');
  digit.click();
  pin.el.model = { ...pin.el.model!, locked: true, lockoutMessage: 'Locked' };
  digit.click();
  expect(pin.intents).toEqual([{ type: 'digitPressed', digit: '1' }]);
  expect(pin.el.model.digitsEntered).toBe(1);
  await pin.el.updateComplete;
  expect(digit.disabled).toBe(true);

  const login = await mount<EmrLoginFormElement>('emr-login-form', { model: {
    username: 'fixture', usernameLabel: 'Username', passwordLabel: 'Password',
  } });
  const form = login.el.shadowRoot!.querySelector('form')!;
  const password = form.querySelector<HTMLInputElement>('[type="password"]')!;
  password.value = 'synthetic';
  form.dispatchEvent(new Event('submit', { cancelable: true }));
  expect(login.intents).toEqual([{ type: 'submitRequested', username: 'fixture', password: 'synthetic' }]);
  expect(password.value).toBe('');
  login.el.model = { ...login.el.model!, busy: true };
  form.dispatchEvent(new Event('submit', { cancelable: true }));
  expect(login.intents).toHaveLength(1);
});

it('routes tab, sync, toast and sheet interactions without changing their accepted state', async () => {
  const tabs = await mount<EmrBottomTabBarElement>('emr-bottom-tab-bar', {
    activeId: 'one', items: [{ id: 'one', label: 'One' }, { id: 'two', label: 'Two' }],
  });
  button(tabs.el, 'Two').click();
  button(tabs.el, 'Scan').click();
  expect(tabs.intents).toEqual([{ type: 'tabSelected', id: 'two' }, { type: 'scanRequested' }]);
  expect(tabs.el.activeId).toBe('one');

  const sync = await mount<EmrSyncPillElement>('emr-sync-pill', {
    model: { label: 'Pending', tone: 'warning', detail: '2 records' }, interactive: true,
  });
  sync.el.shadowRoot!.querySelector('button')!.click();
  expect(sync.intents).toEqual([{ type: 'syncDetailsRequested' }]);

  const toast = await mount<EmrToastElement>('emr-toast', {
    model: { id: 'toast', message: 'Saved', tone: 'success', actionLabel: 'Details' },
  });
  button(toast.el, 'Details').click();
  button(toast.el, 'Dismiss').click();
  expect(toast.intents).toEqual([{ type: 'actionPressed', id: 'toast' }, { type: 'dismissed', id: 'toast' }]);
  expect(toast.el.model?.message).toBe('Saved');

  const sheet = await mount<EmrSheetElement>('emr-sheet', { open: true, title: 'Details', showBack: true });
  button(sheet.el, 'Back').click();
  button(sheet.el, 'Close').click();
  expect(sheet.intents).toEqual([{ type: 'backRequested' }, { type: 'closeRequested' }]);
  expect(sheet.el.open).toBe(true);
});

it('forwards one keyboard result selection through the top bar', async () => {
  const { el, intents } = await mount<EmrTopBarElement>('emr-top-bar', { model: {
    title: 'Clinic',
    search: { query: 'Fixture', open: true, groups: [{ id: 'patients', label: 'Patients', results: [{ id: 'record', label: 'Fixture result' }] }] },
  } });
  const search = el.shadowRoot!.querySelector<EmrTopBarSearchElement>('emr-top-bar-search')!;
  await search.updateComplete;
  const input = search.shadowRoot!.querySelector('input')!;
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  expect(intents).toEqual([{ type: 'resultSelected', groupId: 'patients', id: 'record' }]);
});
