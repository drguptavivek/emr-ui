// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { registerL1Elements } from './index.js';
import type { EmrCheckboxGroupElement, EmrSegmentedControlElement } from './l1-primitives-extra.js';

registerL1Elements();

const mounted: HTMLElement[] = [];

async function mountCheckboxGroup(): Promise<EmrCheckboxGroupElement> {
  const el = document.createElement('emr-checkbox-group') as EmrCheckboxGroupElement;
  document.body.appendChild(el);
  mounted.push(el);
  await el.updateComplete;
  return el;
}

afterEach(() => {
  while (mounted.length) {
    mounted.pop()?.remove();
  }
});

describe('EmrCheckboxGroupElement (emr-checkbox-group)', () => {
  it('renders grouped options, badges, tones, variants, sizes, and labelPlacement', async () => {
    const el = await mountCheckboxGroup();
    el.label = 'Clinical findings';
    el.variant = 'card';
    el.size = 'sm';
    el.labelPlacement = 'space-between';
    el.options = [
      { value: 'pain', label: 'Ocular pain', group: 'Symptoms', badge: { label: 'Urgent', tone: 'danger' }, tone: 'danger' },
      { value: 'redness', label: 'Conjunctival injection', group: 'Symptoms', description: 'Bilateral' },
      { value: 'locked', label: 'Prior surgery', readOnly: true, badge: 'Verified' },
    ];
    el.value = ['pain', 'locked'];
    await el.updateComplete;

    const shadow = el.shadowRoot!;
    const groupHeaders = [...shadow.querySelectorAll('.checkbox-group-section-label')].map((n) => n.textContent?.trim());
    expect(groupHeaders).toEqual(['Symptoms']);

    const buttons = [...shadow.querySelectorAll<HTMLButtonElement>('button[role="checkbox"]')];
    expect(buttons).toHaveLength(3);
    // groupOptions places ungrouped options ('locked') before named groups ('Symptoms')
    expect(buttons[1]!.classList.contains('checkbox-row-btn--card')).toBe(true);
    expect(buttons[1]!.classList.contains('checkbox-row-btn--sm')).toBe(true);
    expect(buttons[1]!.classList.contains('checkbox-row-btn--space-between')).toBe(true);
    expect(buttons[1]!.classList.contains('checkbox-row-btn--tone-danger')).toBe(true);

    const badges = [...shadow.querySelectorAll('.emr-badge')].map((b) => b.textContent?.trim());
    expect(badges).toEqual(['Verified', 'Urgent']);

    // Read-only option has aria-readonly="true", is not disabled, and does not emit on click
    expect(buttons[0]!.disabled).toBe(false);
    expect(buttons[0]!.getAttribute('aria-readonly')).toBe('true');
    const changes: unknown[] = [];
    el.addEventListener('valueChange', (e) => changes.push((e as CustomEvent).detail));
    buttons[0]!.click();
    expect(changes).toEqual([]);
  });

  it('enforces maxSelections without blocking uncheck and renders SVG minus on mixed select-all', async () => {
    const el = await mountCheckboxGroup();
    el.label = 'Allergies';
    el.showSelectAll = true;
    el.maxSelections = 2;
    el.showSelectionCount = true;
    el.clearable = true;
    el.options = [
      { value: 'pcn', label: 'Penicillin' },
      { value: 'sulfa', label: 'Sulfa' },
      { value: 'latex', label: 'Latex' },
      { value: 'locked', label: 'Verified NKDA', readOnly: true },
    ];
    el.value = ['pcn', 'locked'];
    await el.updateComplete;

    const shadow = el.shadowRoot!;
    expect(shadow.querySelector('.checkbox-group-count')?.textContent?.trim()).toBe('2 of 2 selected');

    // Select-all box uses SVG minus (never Unicode '–')
    const selectAllBtn = shadow.querySelector<HTMLButtonElement>('button[data-select-all="true"]')!;
    expect(selectAllBtn.getAttribute('aria-checked')).toBe('mixed');
    const box = selectAllBtn.querySelector('.checkbox-box')!;
    expect(box.textContent?.trim()).toBe('');
    expect(box.querySelector('svg')).not.toBeNull();

    // Unchecked non-locked options are disabled by maxSelections, while checked option remains enabled
    const optionButtons = [...shadow.querySelectorAll<HTMLButtonElement>('button[role="checkbox"]:not([data-select-all])')];
    expect(optionButtons[0]!.disabled).toBe(false); // pcn (checked)
    expect(optionButtons[1]!.disabled).toBe(true);  // sulfa (blocked by max)
    expect(optionButtons[2]!.disabled).toBe(true);  // latex (blocked by max)

    // Clear preserves locked selected option and emits cleared
    const changes: unknown[] = [];
    let clearedCount = 0;
    el.addEventListener('valueChange', (e) => changes.push((e as CustomEvent).detail));
    el.addEventListener('cleared', () => { clearedCount += 1; });
    shadow.querySelector<HTMLButtonElement>('.clear-inline-btn')!.click();
    expect(changes).toEqual([['locked']]);
    expect(clearedCount).toBe(1);
  });

  it('preserves ARIA attributes and showSelectAll when labelHidden is true, and gates focus/blur events', async () => {
    const el = await mountCheckboxGroup();
    el.label = 'Symptoms';
    el.ariaLabel = 'Reported symptoms';
    el.labelHidden = true;
    el.required = true;
    el.readOnly = true;
    el.invalid = true;
    el.showSelectAll = true;
    el.hint = 'Hidden footer hint';
    el.error = 'Hidden footer error';
    el.options = [
      { value: 'a', label: 'Option A' },
      { value: 'b', label: 'Option B' },
    ];
    await el.updateComplete;

    const shadow = el.shadowRoot!;
    const group = shadow.querySelector('[role="group"]')!;
    expect(group.getAttribute('aria-label')).toBe('Reported symptoms');
    expect(group.getAttribute('aria-required')).toBe('true');
    expect(group.getAttribute('aria-readonly')).toBe('true');
    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(shadow.querySelector('button[data-select-all="true"]')).not.toBeNull();
    expect(shadow.querySelector('.emr-hint')).toBeNull();
    expect(shadow.querySelector('.emr-error')).toBeNull();

    let focusCount = 0;
    let blurCount = 0;
    el.addEventListener('focused', () => { focusCount += 1; });
    el.addEventListener('blurred', () => { blurCount += 1; });

    const buttons = [...shadow.querySelectorAll<HTMLButtonElement>('button[role="checkbox"]')];
    group.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    // Moving focus between internal buttons should not emit blurred
    group.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: buttons[1]! }));
    expect(focusCount).toBe(1);
    expect(blurCount).toBe(0);

    group.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    expect(blurCount).toBe(1);
  });
});

describe('EmrSegmentedControlElement (emr-segmented-control)', () => {
  async function mountSegmented(): Promise<EmrSegmentedControlElement> {
    const el = document.createElement('emr-segmented-control') as EmrSegmentedControlElement;
    document.body.appendChild(el);
    mounted.push(el);
    await el.updateComplete;
    return el;
  }

  it('fixes tabStop when first option is disabled and renders size/variant/shape/orientation/icons/badges/descriptions', async () => {
    const el = await mountSegmented();
    el.label = 'Laterality';
    el.size = 'sm';
    el.variant = 'outline';
    el.shape = 'pill';
    el.orientation = 'vertical';
    el.fullWidth = true;
    el.required = true;
    el.warning = 'Verify laterality before procedure';
    el.options = [
      { value: 'none', label: 'None', disabled: true },
      { value: 'od', label: 'OD', description: 'Right eye', icon: 'eye', tone: 'info', badge: { label: 'Primary', tone: 'info' } },
      { value: 'os', label: 'OS', readOnly: true, ariaLabel: 'Left eye locked', badge: 2 },
    ];
    await el.updateComplete;

    const shadow = el.shadowRoot!;
    const track = shadow.querySelector('[role="radiogroup"]')!;
    expect(track.classList.contains('segmented-track--sm')).toBe(true);
    expect(track.classList.contains('segmented-track--outline')).toBe(true);
    expect(track.classList.contains('segmented-track--pill')).toBe(true);
    expect(track.classList.contains('segmented-track--vertical')).toBe(true);
    expect(track.classList.contains('segmented-track--full-width')).toBe(true);
    expect(track.classList.contains('segmented-track--warning')).toBe(true);
    expect(track.getAttribute('aria-required')).toBe('true');
    expect(track.getAttribute('aria-orientation')).toBe('vertical');
    expect(shadow.querySelector('[role="status"]')?.textContent?.trim()).toBe('Verify laterality before procedure');

    const buttons = [...shadow.querySelectorAll<HTMLButtonElement>('button[role="radio"]')];
    expect(buttons[0]!.disabled).toBe(true);
    expect(buttons[0]!.getAttribute('tabindex')).toBe('-1');
    expect(buttons[1]!.getAttribute('tabindex')).toBe('0');
    expect(buttons[1]!.querySelector('svg')).not.toBeNull();
    expect(buttons[1]!.querySelector('.segmented-desc')?.textContent?.trim()).toBe('Right eye');
    expect(buttons[2]!.getAttribute('aria-label')).toBe('Left eye locked');
    expect(buttons[2]!.getAttribute('aria-readonly')).toBe('true');

    const badges = [...shadow.querySelectorAll('.emr-badge')].map((b) => b.textContent?.trim());
    expect(badges).toEqual(['Primary', '2']);
  });

  it('supports allowDeselect, clearable, readOnly arrow navigation without mutation, and focused/blurred coalescing', async () => {
    const el = await mountSegmented();
    el.label = 'Priority';
    el.clearable = true;
    el.allowDeselect = true;
    el.options = [
      { value: 'routine', label: 'Routine' },
      { value: 'urgent', label: 'Urgent', readOnly: true },
    ];
    el.value = 'routine';
    await el.updateComplete;

    const shadow = el.shadowRoot!;
    const events: unknown[] = [];
    let clearedCount = 0;
    let focusCount = 0;
    let blurCount = 0;
    el.addEventListener('valueChange', (e) => events.push((e as CustomEvent).detail));
    el.addEventListener('cleared', () => { clearedCount += 1; });
    el.addEventListener('focused', () => { focusCount += 1; });
    el.addEventListener('blurred', () => { blurCount += 1; });

    const buttons = [...shadow.querySelectorAll<HTMLButtonElement>('button[role="radio"]')];
    // ArrowRight moves focus to readOnly option without mutating value
    buttons[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(events).toEqual([]);

    // Space on selected option with allowDeselect clears it
    buttons[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(events).toEqual([null]);
    expect(clearedCount).toBe(1);

    // Clear button has monochrome SVG icon
    const clearBtn = shadow.querySelector<HTMLButtonElement>('[data-clear-btn="true"]')!;
    expect(clearBtn.querySelector('svg')).not.toBeNull();
    clearBtn.click();
    expect(clearedCount).toBe(2);

    // Focus/blur coalescing across internal buttons
    const field = shadow.querySelector('.emr-field')!;
    field.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    field.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: buttons[1]! }));
    expect(focusCount).toBe(1);
    expect(blurCount).toBe(0);
    field.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    expect(blurCount).toBe(1);
  });

  it('keeps sr-only messages when labelHidden is true and renders error with role="alert"', async () => {
    const el = await mountSegmented();
    el.label = 'Mode';
    el.labelHidden = true;
    el.error = 'Selection required';
    el.options = [{ value: 'a', label: 'A' }];
    await el.updateComplete;

    const shadow = el.shadowRoot!;
    const track = shadow.querySelector('[role="radiogroup"]')!;
    expect(track.getAttribute('aria-invalid')).toBe('true');
    const err = shadow.querySelector('[role="alert"]')!;
    expect(err.classList.contains('emr-sr-only')).toBe(true);
    expect(err.textContent?.trim()).toBe('Selection required');
  });
});
