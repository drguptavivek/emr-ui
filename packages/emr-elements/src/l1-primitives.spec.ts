// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { localDateTimeToUtcIso, toLocalDateTimeInputValue } from '@drguptavivek/emr-controller';
import {
  registerL1Elements,
  type EmrAvatarElement,
  type EmrButtonElement,
  type EmrCardElement,
  type EmrCheckboxElement,
  type EmrCheckboxGroupElement,
  type EmrChipElement,
  type EmrColumnsElement,
  type EmrDateInputElement,
  type EmrDateTimeInputElement,
  type EmrDialogElement,
  type EmrFileTriggerElement,
  type EmrIconButtonElement,
  type EmrLikertElement,
  type EmrNumberInputElement,
  type EmrNumericStepperElement,
  type EmrPaginationElement,
  type EmrPasswordInputElement,
  type EmrPopoverElement,
  type EmrProgressBarElement,
  type EmrQuantityInputElement,
  type EmrRadioGroupElement,
  type EmrSearchInputElement,
  type EmrSearchSelectElement,
  type EmrSegmentedControlElement,
  type EmrSelectElement,
  type EmrSeparatorElement,
  type EmrSkeletonElement,
  type EmrSpinnerElement,
  type EmrStageStepperElement,
  type EmrStatTileElement,
  type EmrStateMessageElement,
  type EmrStatusCellElement,
  type EmrTabsElement,
  type EmrTextareaElement,
  type EmrTextInputElement,
  type EmrToastElement,
  type EmrToggleElement,
  type EmrTooltipElement,
  type EmrVasElement,
} from './l1-primitives.js';

registerL1Elements();

async function mount<T extends HTMLElement & { updateComplete: Promise<unknown> }>(tag: string): Promise<T> {
  const el = document.createElement(tag) as T;
  document.body.append(el);
  await el.updateComplete;
  return el;
}

describe('controlled L1 primitives', () => {
  it('keeps text drafts and syncs accepted host values, including read-only events', async () => {
    const el = await mount<EmrTextInputElement>('emr-text-input');
    const changes: unknown[] = [];
    el.addEventListener('valueChange', (e) => changes.push((e as CustomEvent).detail));
    const input = el.shadowRoot!.querySelector('input')!;
    input.value = 'draft'; input.dispatchEvent(new Event('input'));
    expect(el.value).toBe(''); expect(changes).toEqual(['draft']);
    el.value = 'accepted'; await el.updateComplete;
    expect(input.value).toBe('accepted');
    el.readOnly = true; await el.updateComplete;
    input.dispatchEvent(new Event('input')); expect(changes).toEqual(['draft']);
    el.remove();
  });

  it('preserves numerical drafts, rejects invalid numbers, and respects host changes', async () => {
    const el = await mount<EmrNumberInputElement>('emr-number-input');
    const changes: unknown[] = [];
    el.addEventListener('valueChange', (e) => changes.push((e as CustomEvent).detail));
    const input = el.shadowRoot!.querySelector('input')!;
    input.value = '-'; input.dispatchEvent(new Event('input'));
    expect(changes).toEqual([]);
    input.value = '1.'; input.dispatchEvent(new Event('input'));
    expect(changes).toEqual([1]); expect(el.value).toBeNull();
    el.value = 1; await el.updateComplete; expect(input.value).toBe('1.');
    el.value = 2; await el.updateComplete; expect(input.value).toBe('2');
    input.value = ''; input.dispatchEvent(new Event('input')); expect(changes).toEqual([1, null]);
    el.remove();
  });

  it('restores a rejected numeric draft on blur and when locked', async () => {
    const el = await mount<EmrNumberInputElement>('emr-number-input');
    el.value = 12; await el.updateComplete;
    const input = el.shadowRoot!.querySelector('input')!;
    input.value = '-'; input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur')); expect(input.value).toBe('12');
    input.value = '-'; input.dispatchEvent(new Event('input'));
    el.readOnly = true; await el.updateComplete; expect(input.value).toBe('12');
    el.readOnly = false; await el.updateComplete; expect(input.value).toBe('12');
    el.remove();
  });

  it.each([
    ['emr-text-input', 'value', 'accepted', 'rejected', 0],
    ['emr-date-input', 'value', '2026-01-02', '2026-02-03', 0],
    ['emr-time-input', 'value', '12:00', '13:00', 0],
    ['emr-datetime-input', 'value', '2026-01-02T12:00', '2026-02-03T13:00', 0],
    ['emr-paired-input', 'secondValue', 'accepted', 'rejected', 1],
    ['emr-search-select', 'query', 'accepted', 'rejected', 0],
  ])('restores a rejected %s draft on blur and lock', async (tag, property, accepted, rejected, index) => {
    const el = await mount<HTMLElement & { updateComplete: Promise<unknown>; readOnly: boolean }>(tag);
    Object.assign(el, { [property]: accepted }); await el.updateComplete;
    const input = el.shadowRoot!.querySelectorAll('input')[index];
    input.value = rejected; input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur')); expect(input.value).toBe(accepted);
    input.value = rejected; input.dispatchEvent(new Event('input'));
    el.readOnly = true; await el.updateComplete; expect(input.value).toBe(accepted);
    el.remove();
  });

  it('opens a combobox dropdown for emr-select, selects without implicit clearing, and respects readOnly', async () => {
    const el = await mount<EmrSelectElement>('emr-select');
    el.value = 'a';
    el.options = [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }];
    await el.updateComplete;
    const changes: unknown[] = [];
    el.addEventListener('valueChange', (e) => changes.push((e as CustomEvent).detail));

    const trigger = el.shadowRoot!.querySelector<HTMLButtonElement>('[role="combobox"]')!;
    expect(trigger).not.toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(el.shadowRoot!.querySelector('[role="listbox"]')).toBeNull();

    trigger.click();
    await el.updateComplete;
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const options = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="option"]');
    expect(options).toHaveLength(2);
    options[0]!.click();
    await el.updateComplete;
    expect(changes).toEqual(['a']);
    expect(el.value).toBe('a');
    expect(el.shadowRoot!.querySelector('[role="listbox"]')).toBeNull();

    // Escape closes an open listbox without emitting
    trigger.click();
    await el.updateComplete;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await el.updateComplete;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    // Read-only stays focusable (not disabled) and does not open
    el.readOnly = true;
    await el.updateComplete;
    expect(trigger.disabled).toBe(false);
    expect(trigger.getAttribute('aria-readonly')).toBe('true');
    trigger.click();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('[role="listbox"]')).toBeNull();
    el.remove();
  });

  it('renders emr-toggle as a switch track + thumb distinct from emr-checkbox', async () => {
    const toggle = await mount<EmrToggleElement>('emr-toggle');
    const checkbox = await mount<EmrCheckboxElement>('emr-checkbox');
    toggle.label = 'Monocular precaution';
    toggle.checked = true;
    checkbox.label = 'Dilated';
    checkbox.checked = true;
    await toggle.updateComplete;
    await checkbox.updateComplete;

    const toggleBtn = toggle.shadowRoot!.querySelector<HTMLButtonElement>('[role="switch"]')!;
    expect(toggleBtn).not.toBeNull();
    expect(toggle.shadowRoot!.querySelector('.switch-track')).not.toBeNull();
    expect(toggle.shadowRoot!.querySelector('.switch-thumb')).not.toBeNull();
    expect(toggle.shadowRoot!.querySelector('.indicator')).toBeNull();

    expect(checkbox.shadowRoot!.querySelector('[role="checkbox"]')).not.toBeNull();
    expect(checkbox.shadowRoot!.querySelector('.indicator')).not.toBeNull();
    expect(checkbox.shadowRoot!.querySelector('.switch-track')).toBeNull();

    const changes: unknown[] = [];
    const checkedChanges: unknown[] = [];
    toggle.addEventListener('valueChange', (e) => changes.push((e as CustomEvent).detail));
    toggle.addEventListener('checkedChange', (e) => checkedChanges.push((e as CustomEvent).detail));
    toggleBtn.click();
    expect(changes).toEqual([false]);
    expect(checkedChanges).toEqual([false]);

    toggle.readOnly = true;
    await toggle.updateComplete;
    expect(toggleBtn.disabled).toBe(false);
    expect(toggleBtn.getAttribute('aria-readonly')).toBe('true');
    toggleBtn.click();
    expect(changes).toEqual([false]);

    toggle.remove();
    checkbox.remove();
  });

  it('opens an EMR calendar component for emr-date-input instead of a browser date input', async () => {
    const el = await mount<EmrDateInputElement>('emr-date-input');
    el.value = '2026-10-14';
    await el.updateComplete;

    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.type).toBe('text');
    expect(el.shadowRoot!.querySelector('input[type="date"]')).toBeNull();

    const changes: unknown[] = [];
    el.addEventListener('valueChange', (e) => changes.push((e as CustomEvent).detail));

    const calBtn = el.shadowRoot!.querySelector<HTMLButtonElement>('button[aria-label="Choose date"]')!;
    expect(calBtn).not.toBeNull();
    expect(el.shadowRoot!.querySelector('[role="dialog"]')).toBeNull();

    calBtn.click();
    await el.updateComplete;
    const dialog = el.shadowRoot!.querySelector('[role="dialog"]')!;
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('October 2026');
    expect(dialog.querySelectorAll('[role="row"]').length).toBeGreaterThan(0);
    expect(dialog.querySelectorAll('[role="gridcell"]').length).toBeGreaterThan(0);

    // Step to November 2026 and pick 5 November 2026
    el.shadowRoot!.querySelector<HTMLButtonElement>('button[aria-label="Next month"]')!.click();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('[role="dialog"]')!.textContent).toContain('November 2026');

    el.shadowRoot!.querySelector<HTMLButtonElement>('button[aria-label="5 November 2026"]')!.click();
    await el.updateComplete;
    expect(changes).toEqual(['2026-11-05']);
    expect(el.shadowRoot!.querySelector('[role="dialog"]')).toBeNull();

    // Clear action emits null
    calBtn.click();
    await el.updateComplete;
    el.shadowRoot!.querySelector<HTMLButtonElement>('button[aria-label="Clear date"]')!.click();
    await el.updateComplete;
    expect(changes).toEqual(['2026-11-05', null]);

    // Read-only prevents opening the calendar
    el.readOnly = true;
    await el.updateComplete;
    calBtn.click();
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('[role="dialog"]')).toBeNull();
    el.remove();
  });

  it('moves between enabled tabs with arrow keys and emits tabChange and valueChange', async () => {
    const el = await mount<EmrTabsElement>('emr-tabs');
    el.tabs = [{ label: 'A', value: 'a' }, { label: 'B', value: 'b', disabled: true }, { label: 'C', value: 'c' }];
    await el.updateComplete;
    const changes: unknown[] = [];
    const tabChanges: unknown[] = [];
    el.addEventListener('valueChange', (e) => changes.push((e as CustomEvent).detail));
    el.addEventListener('tabChange', (e) => tabChanges.push((e as CustomEvent).detail));
    const buttons = el.shadowRoot!.querySelectorAll('button');
    buttons[0]!.focus();
    buttons[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(changes).toEqual(['c']);
    expect(tabChanges).toEqual(['c']);
    expect(el.shadowRoot!.activeElement).toBe(buttons[2]);
    el.remove();
  });

  it('forwards a quantity change once without leaking inner select valueChange and blocks disabled units', async () => {
    const el = await mount<EmrQuantityInputElement>('emr-quantity-input');
    el.units = [{ label: 'Unit', value: 'u', disabled: true }, { label: 'mmHg', value: 'mmHg' }];
    await el.updateComplete;
    const changes: unknown[] = []; const units: unknown[] = [];
    el.addEventListener('valueChange', (e) => changes.push((e as CustomEvent).detail));
    el.addEventListener('unitChange', (e) => units.push((e as CustomEvent).detail));
    const nested = el.shadowRoot!.querySelector('emr-number-input') as EmrNumberInputElement;
    const unitSelect = el.shadowRoot!.querySelector('emr-select') as EmrSelectElement;
    await nested.updateComplete;
    await unitSelect.updateComplete;
    nested.shadowRoot!.querySelector('button:last-child')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    unitSelect.shadowRoot!.querySelector<HTMLButtonElement>('[role="combobox"]')!.click();
    await unitSelect.updateComplete;
    const opts = unitSelect.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="option"]');
    opts[0]!.click(); // disabled unit
    expect(changes).toEqual([1]); expect(units).toEqual([]); expect(el.value).toBeNull();
    opts[1]!.click(); // enabled unit — must NOT leak onto valueChange!
    expect(changes).toEqual([1]);
    expect(units).toEqual(['mmHg']);
    el.remove();
  });

  it('renders unmarked VAS ruler with no thumb when value is null and emits controlled slider values', async () => {
    const el = await mount<EmrVasElement>('emr-vas');
    el.anchors = { minLabel: 'No pain', midLabel: 'Moderate', maxLabel: 'Worst pain' };
    await el.updateComplete;

    const slider = el.shadowRoot!.querySelector<HTMLElement>('[role="slider"]')!;
    expect(slider).not.toBeNull();
    expect(el.shadowRoot!.querySelector('input[type="range"]')).toBeNull();
    expect([slider.getAttribute('aria-valuemin'), slider.getAttribute('aria-valuemax')]).toEqual(['0', '100']);
    expect(slider.hasAttribute('aria-valuenow')).toBe(false);
    expect(el.shadowRoot!.querySelector('.vas-thumb')).toBeNull();

    const changes: unknown[] = [];
    el.addEventListener('valueChange', (e) => changes.push((e as CustomEvent).detail));
    slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(changes).toEqual([100]);
    expect(el.value).toBeNull();
    expect(el.shadowRoot!.querySelector('.vas-thumb')).toBeNull();

    el.value = 45;
    await el.updateComplete;
    expect(slider.getAttribute('aria-valuenow')).toBe('45');
    expect(el.shadowRoot!.querySelector('.vas-thumb')).not.toBeNull();
    el.remove();
  });

  it('uses a button and canonical intent only when the stat is interactive', async () => {
    const el = await mount<EmrStatTileElement>('emr-stat-tile');
    el.model = { key: 'k', label: 'Count', value: '2' }; el.interactive = false; await el.updateComplete;
    expect(el.shadowRoot!.querySelector('button')).toBeNull();
    el.interactive = true; await el.updateComplete;
    const changes: unknown[] = []; el.addEventListener('intent', (e) => changes.push((e as CustomEvent).detail));
    el.shadowRoot!.querySelector('button')!.click(); expect(changes).toEqual([{ type: 'statSelected', key: 'k' }]);
    el.readOnly = true; await el.updateComplete; expect(el.shadowRoot!.querySelector('button')).toBeNull();
    el.remove();
  });

  it('generates unique non-empty fallback controlIds and supports labelHidden chromeless mode', async () => {
    const a = await mount<EmrTextInputElement>('emr-text-input');
    const b = await mount<EmrTextInputElement>('emr-text-input');
    a.label = 'First';
    b.label = 'Second';
    await Promise.all([a.updateComplete, b.updateComplete]);

    const aInput = a.shadowRoot!.querySelector('input')!;
    const aLabel = a.shadowRoot!.querySelector('label')!;
    const bInput = b.shadowRoot!.querySelector('input')!;
    expect(aInput.id).not.toBe('');
    expect(aLabel.getAttribute('for')).toBe(aInput.id);
    expect(bInput.id).not.toBe(aInput.id);

    a.labelHidden = true;
    a.hint = 'Hidden in chromeless';
    a.error = 'Hidden error';
    await a.updateComplete;
    expect(a.shadowRoot!.querySelector('label')).toBeNull();
    expect(a.shadowRoot!.querySelector('.emr-hint')).toBeNull();
    expect(a.shadowRoot!.querySelector('.emr-error')).toBeNull();
    expect(a.shadowRoot!.querySelector('input')!.getAttribute('aria-label')).toBe('First');
    expect(a.shadowRoot!.querySelector('input')!.getAttribute('aria-invalid')).toBe('true');

    a.remove();
    b.remove();
  });

  it('converts UTC ISO values in emr-datetime-input and emits utc or local wireFormat', async () => {
    const el = await mount<EmrDateTimeInputElement>('emr-datetime-input');
    const utc = '2026-10-14T09:30:00Z';
    el.value = utc;
    await el.updateComplete;
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.value).toBe(toLocalDateTimeInputValue(utc, 'minute'));

    const changes: unknown[] = [];
    el.addEventListener('valueChange', (e) => changes.push((e as CustomEvent).detail));

    input.value = '2026-10-14T15:45';
    input.dispatchEvent(new Event('input'));
    expect(changes).toEqual([localDateTimeToUtcIso('2026-10-14T15:45')]);

    el.wireFormat = 'local';
    await el.updateComplete;
    input.value = '2026-10-14T16:00';
    input.dispatchEvent(new Event('input'));
    expect(changes[1]).toBe('2026-10-14T16:00');
    el.remove();
  });

  it('enforces integer mode on emr-number-input and min/max bounds on emr-date-input', async () => {
    const num = await mount<EmrNumberInputElement>('emr-number-input');
    num.mode = 'integer';
    await num.updateComplete;
    const numEvents: unknown[] = [];
    num.addEventListener('valueChange', e => numEvents.push((e as CustomEvent).detail));
    const numInput = num.shadowRoot!.querySelector('input')!;
    numInput.value = '12.5';
    numInput.dispatchEvent(new Event('input'));
    expect(numEvents).toEqual([]);
    numInput.value = '12';
    numInput.dispatchEvent(new Event('input'));
    expect(numEvents).toEqual([12]);
    num.remove();

    const date = await mount<EmrDateInputElement>('emr-date-input');
    date.min = '2026-05-10';
    date.max = '2026-05-20';
    await date.updateComplete;
    const dateEvents: unknown[] = [];
    date.addEventListener('valueChange', e => dateEvents.push((e as CustomEvent).detail));
    const dateInput = date.shadowRoot!.querySelector('input')!;
    dateInput.value = '2026-05-05';
    dateInput.dispatchEvent(new Event('input'));
    expect(dateEvents).toEqual([]);
    dateInput.value = '2026-05-15';
    dateInput.dispatchEvent(new Event('input'));
    expect(dateEvents).toEqual(['2026-05-15']);
    date.remove();
  });

  it('supports mixed checkbox state, search-select closed-by-default & multi-select, and removable chips', async () => {
    const cb = await mount<EmrCheckboxElement>('emr-checkbox');
    cb.mixed = true;
    await cb.updateComplete;
    const cbBtn = cb.shadowRoot!.querySelector<HTMLButtonElement>('[role="checkbox"]')!;
    expect(cbBtn.getAttribute('aria-checked')).toBe('mixed');
    expect(cbBtn.textContent).toContain('–');
    const checked: unknown[] = [];
    cb.addEventListener('checkedChange', e => checked.push((e as CustomEvent).detail));
    cbBtn.click();
    expect(checked).toEqual([true]);
    cb.remove();

    const ss = await mount<EmrSearchSelectElement>('emr-search-select');
    expect(ss.open).toBe(false);
    expect(ss.shadowRoot!.querySelector('[role="listbox"]')).toBeNull();
    ss.multiple = true;
    ss.selected = [{ value: 'glaucoma', label: 'Glaucoma' }];
    ss.options = [{ value: 'cataract', label: 'Cataract' }];
    ss.open = true;
    await ss.updateComplete;
    const removed: unknown[] = [];
    const selected: unknown[] = [];
    ss.addEventListener('selectionRemoved', e => removed.push((e as CustomEvent).detail));
    ss.addEventListener('optionSelected', e => selected.push((e as CustomEvent).detail));
    ss.shadowRoot!.querySelector<HTMLButtonElement>('button[aria-label="Remove Glaucoma"]')!.click();
    ss.shadowRoot!.querySelector<HTMLButtonElement>('button[role="option"]')!.click();
    expect(removed).toEqual(['glaucoma']);
    expect(selected).toEqual(['cataract']);
    ss.remove();

    const chip = await mount<EmrChipElement>('emr-chip');
    chip.label = 'Latex';
    chip.removable = true;
    await chip.updateComplete;
    let removeCount = 0;
    chip.addEventListener('removeRequested', () => { removeCount += 1; });
    chip.shadowRoot!.querySelector('button')!.click();
    expect(removeCount).toBe(1);
    chip.remove();
  });

  it('supports canonical display/layout props, legacy aliases, focusable readOnly, and emr-toast in L1', async () => {
    const btn = await mount<EmrButtonElement>('emr-button');
    btn.variant = 'ghost';
    btn.size = 'lg';
    btn.block = true;
    btn.loading = true;
    await btn.updateComplete;
    const nativeBtn = btn.shadowRoot!.querySelector('button')!;
    expect(nativeBtn.className).toContain('emr-btn--ghost');
    expect(nativeBtn.className).toContain('emr-btn--lg');
    expect(nativeBtn.className).toContain('emr-btn--block');
    expect(nativeBtn.disabled).toBe(true);
    btn.remove();

    const msg = await mount<EmrStateMessageElement>('emr-state-message');
    msg.state = 'error';
    msg.description = 'Network down';
    await msg.updateComplete;
    expect(msg.kind).toBe('error');
    expect(msg.message).toBe('Network down');
    msg.remove();

    const card = await mount<EmrCardElement>('emr-card');
    card.label = 'Vitals';
    card.padded = false;
    await card.updateComplete;
    expect(card.shadowRoot!.querySelector('section')!.className).toContain('emr-card--flush');
    expect(card.shadowRoot!.querySelector('h3')!.textContent).toBe('Vitals');
    card.remove();

    const cols = await mount<EmrColumnsElement>('emr-columns');
    cols.columns = 3;
    cols.widths = ['1fr', '2fr', '1fr'];
    await cols.updateComplete;
    expect(cols.count).toBe(3);
    expect(cols.shadowRoot!.querySelector('.columns-grid')!.getAttribute('style')).toContain('1fr 2fr 1fr');
    cols.remove();

    const cell = await mount<EmrStatusCellElement>('emr-status-cell');
    cell.status = { label: 'Critical', tone: 'danger' };
    cell.valueLabel = '32 mmHg';
    cell.attribution = { author: 'Dr Rao', timestamp: '09:15' };
    cell.actionLabel = 'Repeat';
    cell.interactive = true;
    await cell.updateComplete;
    let actionCount = 0;
    cell.addEventListener('actionClicked', () => { actionCount += 1; });
    cell.shadowRoot!.querySelector<HTMLButtonElement>('.status-cell-action')!.click();
    expect(actionCount).toBe(1);
    cell.remove();

    const stepper = await mount<EmrStageStepperElement>('emr-stage-stepper');
    stepper.stages = [{ id: 's1', label: 'Sign in' }, { id: 's2', label: 'Time out' }];
    stepper.activeId = 's1';
    stepper.readOnly = true;
    await stepper.updateComplete;
    const stepBtns = stepper.shadowRoot!.querySelectorAll('button');
    expect(stepBtns[1]!.disabled).toBe(false); // focusable when readOnly!
    const stageEvents: unknown[] = [];
    stepper.addEventListener('stageSelected', e => stageEvents.push((e as CustomEvent).detail));
    stepBtns[1]!.click();
    expect(stageEvents).toEqual([]);
    stepper.readOnly = false;
    await stepper.updateComplete;
    stepper.shadowRoot!.querySelectorAll('button')[1]!.click();
    expect(stageEvents).toEqual(['s2']);
    stepper.remove();

    const sep = await mount<EmrSeparatorElement>('emr-separator');
    expect(sep.shadowRoot!.querySelector('.separator-plain')).not.toBeNull();
    expect(sep.shadowRoot!.querySelector('.separator-labelled')).toBeNull();
    sep.remove();

    const rg = await mount<EmrRadioGroupElement>('emr-radio-group');
    rg.options = [{ value: 'od', label: 'OD' }];
    rg.readOnly = true;
    await rg.updateComplete;
    expect(rg.shadowRoot!.querySelector('button')!.disabled).toBe(false);
    rg.remove();

    const likert = await mount<EmrLikertElement>('emr-likert');
    likert.min = 0;
    likert.max = 3;
    likert.readOnly = true;
    await likert.updateComplete;
    expect(likert.shadowRoot!.querySelector('button')!.disabled).toBe(false);
    likert.remove();

    const toast = await mount<EmrToastElement>('emr-toast');
    toast.model = { id: 't1', tone: 'warning', message: 'Saved offline', actionLabel: 'Retry' };
    await toast.updateComplete;
    const toastActions: string[] = [];
    toast.addEventListener('actionClicked', () => toastActions.push('action'));
    toast.addEventListener('dismissRequested', () => toastActions.push('dismiss'));
    const toastBtns = toast.shadowRoot!.querySelectorAll('button');
    toastBtns[0]!.click();
    toastBtns[1]!.click();
    expect(toastActions).toEqual(['action', 'dismiss']);
    toast.remove();
  });

  it('exercises all 16 new L1 primitives cleanly', async () => {
    // 1. emr-textarea
    const ta = await mount<EmrTextareaElement>('emr-textarea');
    const taChanges: unknown[] = [];
    ta.addEventListener('valueChange', e => taChanges.push((e as CustomEvent).detail));
    const taEl = ta.shadowRoot!.querySelector('textarea')!;
    taEl.value = 'Clinical note';
    taEl.dispatchEvent(new Event('input'));
    taEl.value = '';
    taEl.dispatchEvent(new Event('input'));
    expect(taChanges).toEqual(['Clinical note', null]);
    ta.remove();

    // 2. emr-icon-button
    const ib = await mount<EmrIconButtonElement>('emr-icon-button');
    ib.icon = 'camera';
    ib.ariaLabel = 'Capture';
    await ib.updateComplete;
    let ibClicked = 0;
    ib.addEventListener('clicked', () => { ibClicked += 1; });
    ib.shadowRoot!.querySelector('button')!.click();
    expect(ibClicked).toBe(1);
    ib.remove();

    // 3. emr-segmented-control
    const seg = await mount<EmrSegmentedControlElement>('emr-segmented-control');
    seg.options = [{ value: 'od', label: 'OD' }, { value: 'os', label: 'OS' }];
    seg.value = 'od';
    await seg.updateComplete;
    const segChanges: unknown[] = [];
    seg.addEventListener('valueChange', e => segChanges.push((e as CustomEvent).detail));
    seg.shadowRoot!.querySelectorAll('button')[1]!.click();
    expect(segChanges).toEqual(['os']);
    seg.remove();

    // 4. emr-search-input
    const si = await mount<EmrSearchInputElement>('emr-search-input');
    si.value = 'cataract';
    await si.updateComplete;
    const siEvents: string[] = [];
    si.addEventListener('submitted', () => siEvents.push('submit'));
    si.addEventListener('cleared', () => siEvents.push('clear'));
    si.shadowRoot!.querySelector('input')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    si.shadowRoot!.querySelector<HTMLButtonElement>('button[aria-label="Clear search"]')!.click();
    expect(siEvents).toEqual(['submit', 'clear']);
    si.remove();

    // 5. emr-password-input
    const pw = await mount<EmrPasswordInputElement>('emr-password-input');
    const pwInput = pw.shadowRoot!.querySelector('input')!;
    expect(pwInput.type).toBe('password');
    pw.shadowRoot!.querySelector('button')!.click();
    await pw.updateComplete;
    expect(pw.shadowRoot!.querySelector('input')!.type).toBe('text');
    pw.remove();

    // 6. emr-numeric-stepper
    const ns = await mount<EmrNumericStepperElement>('emr-numeric-stepper');
    ns.value = 1.0;
    ns.step = 0.25;
    ns.precision = 2;
    await ns.updateComplete;
    const nsChanges: unknown[] = [];
    ns.addEventListener('valueChange', e => nsChanges.push((e as CustomEvent).detail));
    ns.shadowRoot!.querySelectorAll('button')[1]!.click();
    expect(nsChanges).toEqual([1.25]);
    ns.remove();

    // 7. emr-checkbox-group
    const cbg = await mount<EmrCheckboxGroupElement>('emr-checkbox-group');
    cbg.options = [{ value: 'dm', label: 'Diabetes' }, { value: 'htn', label: 'Hypertension' }];
    cbg.value = ['dm'];
    await cbg.updateComplete;
    const cbgChanges: unknown[] = [];
    cbg.addEventListener('valueChange', e => cbgChanges.push((e as CustomEvent).detail));
    cbg.shadowRoot!.querySelectorAll('button')[1]!.click();
    expect(cbgChanges).toEqual([['dm', 'htn']]);
    cbg.remove();

    // 8. emr-pagination
    const pg = await mount<EmrPaginationElement>('emr-pagination');
    pg.page = 1;
    pg.pageSize = 10;
    pg.totalItems = 35;
    pg.pageSizeOptions = [10, 25];
    await pg.updateComplete;
    const pgChanges: unknown[] = [];
    pg.addEventListener('pageChange', e => pgChanges.push((e as CustomEvent).detail));
    pg.shadowRoot!.querySelector<HTMLButtonElement>('button[aria-label="Next page"]')!.click();
    expect(pgChanges).toEqual([2]);
    pg.remove();

    // 9. emr-dialog
    const dlg = await mount<EmrDialogElement>('emr-dialog');
    dlg.open = true;
    dlg.title = 'Confirm sign-off';
    await dlg.updateComplete;
    let closeReq = 0;
    dlg.addEventListener('closeRequested', () => { closeReq += 1; });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(closeReq).toBe(1);
    dlg.remove();

    // 10. emr-popover
    const pop = await mount<EmrPopoverElement>('emr-popover');
    const popEvents: unknown[] = [];
    pop.addEventListener('openChange', e => popEvents.push((e as CustomEvent).detail));
    pop.shadowRoot!.querySelector('.popover-trigger')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(popEvents).toEqual([true]);
    pop.remove();

    // 11. emr-tooltip
    const tip = await mount<EmrTooltipElement>('emr-tooltip');
    tip.content = 'Intraocular pressure';
    await tip.updateComplete;
    tip.shadowRoot!.querySelector('.tooltip-root')!.dispatchEvent(new MouseEvent('mouseenter'));
    await tip.updateComplete;
    expect(tip.shadowRoot!.querySelector('[role="tooltip"]')!.textContent).toContain('Intraocular pressure');
    tip.remove();

    // 12–15. progress-bar, spinner, skeleton, avatar
    const pb = await mount<EmrProgressBarElement>('emr-progress-bar');
    pb.value = 60;
    await pb.updateComplete;
    expect(pb.shadowRoot!.querySelector('[role="progressbar"]')!.getAttribute('aria-valuenow')).toBe('60');
    pb.remove();

    const sp = await mount<EmrSpinnerElement>('emr-spinner');
    expect(sp.shadowRoot!.querySelector('[role="status"]')).not.toBeNull();
    sp.remove();

    const sk = await mount<EmrSkeletonElement>('emr-skeleton');
    sk.lines = 3;
    await sk.updateComplete;
    expect(sk.shadowRoot!.querySelectorAll('.skeleton-block')).toHaveLength(3);
    sk.remove();

    const av = await mount<EmrAvatarElement>('emr-avatar');
    av.name = 'Ananya Sharma';
    await av.updateComplete;
    expect(av.shadowRoot!.textContent).toContain('AS');
    av.remove();

    // 16. emr-file-trigger
    const ft = await mount<EmrFileTriggerElement>('emr-file-trigger');
    const selectedMeta: unknown[] = [];
    ft.addEventListener('filesSelected', e => selectedMeta.push((e as CustomEvent).detail));
    const fileInput = ft.shadowRoot!.querySelector('input[type="file"]')!;
    const mockFile = new File(['oct'], 'oct-scan.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [mockFile], configurable: true });
    fileInput.dispatchEvent(new Event('change'));
    expect(selectedMeta).toEqual([[{ name: 'oct-scan.png', sizeBytes: 3, mimeType: 'image/png', lastModified: mockFile.lastModified }]]);
    ft.remove();
  });
});
