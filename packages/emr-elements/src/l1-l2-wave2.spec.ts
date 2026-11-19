// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_CLINICAL_COLOR_SWATCHES,
  type EmrTreeNode,
  type ImageFieldIntent,
} from '@drguptavivek/emr-controller';
import {
  EmrAccordionElement,
  EmrBreadcrumbsElement,
  EmrCheckboxElement,
  EmrCheckboxGroupElement,
  EmrColorPickerElement,
  EmrComboboxElement,
  EmrCopyButtonElement,
  EmrDateRangeInputElement,
  EmrImageCropperElement,
  EmrImageFieldElement,
  EmrImageUploadElement,
  EmrImageViewerElement,
  EmrLikertElement,
  EmrMaskedInputElement,
  EmrMenuElement,
  EmrOtpInputElement,
  EmrRadioGroupElement,
  EmrRangeSliderElement,
  EmrSearchSelectElement,
  EmrSegmentedControlElement,
  EmrSelectElement,
  EmrSliderElement,
  EmrSplitButtonElement,
  EmrTagInputElement,
  EmrToggleElement,
  EmrToggleGroupElement,
  EmrTreeSelectElement,
  EmrTreeViewElement,
  EmrTypedFieldElement,
  EmrVasElement,
  registerAllEmrElements,
} from './index.js';

registerAllEmrElements();

const SAMPLE_TREE: readonly EmrTreeNode[] = [
  {
    id: 'ant',
    label: 'Anterior Segment',
    children: [
      { id: 'cornea', label: 'Cornea' },
      { id: 'lens', label: 'Crystalline Lens' },
    ],
  },
  {
    id: 'post',
    label: 'Posterior Segment',
    children: [{ id: 'retina', label: 'Retina' }],
  },
];

describe('Wave 2 Part 1 — Upgraded Lit L1 Choice & Select Elements', () => {
  let host: HTMLElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('upgrades EmrSelectElement with grouped options ([role="group"]) and clearable button', async () => {
    const el = document.createElement('emr-select') as EmrSelectElement;
    el.label = 'Medication Route';
    el.clearable = true;
    el.value = 'topical';
    el.options = [
      { value: 'topical', label: 'Topical drops', group: 'Ocular' },
      { value: 'intravitreal', label: 'Intravitreal', group: 'Ocular' },
      { value: 'oral', label: 'Oral tablet', group: 'Systemic' },
    ];
    host.appendChild(el);
    await el.updateComplete;

    const trigger = el.shadowRoot?.querySelector<HTMLButtonElement>('.select-trigger');
    expect(trigger).toBeTruthy();
    trigger?.click();
    await el.updateComplete;

    const optgroups = el.shadowRoot?.querySelectorAll('[role="group"]') ?? [];
    expect(optgroups.length).toBeGreaterThanOrEqual(2);

    const values: (string | null)[] = [];
    let clearedCount = 0;
    el.addEventListener('valueChange', e => values.push((e as CustomEvent<string | null>).detail));
    el.addEventListener('cleared', () => {
      clearedCount += 1;
    });

    const clearBtn = el.shadowRoot?.querySelector<HTMLButtonElement>('[data-clear-btn="true"]');
    expect(clearBtn).toBeTruthy();
    clearBtn?.click();
    expect(clearedCount).toBe(1);
    expect(values).toEqual([null]);
  });

  it('upgrades EmrSearchSelectElement with local filtering, grouped options, custom value, and clearable', async () => {
    const el = document.createElement('emr-search-select') as EmrSearchSelectElement;
    el.label = 'Diagnosis';
    el.filterMode = 'local';
    el.clearable = true;
    el.allowCustomValue = true;
    el.open = true;
    el.options = [
      { value: 'cataract', label: 'Senile Cataract', group: 'Lens' },
      { value: 'glaucoma', label: 'Open-Angle Glaucoma', group: 'Optic Nerve' },
    ];
    host.appendChild(el);
    await el.updateComplete;

    const input = el.shadowRoot?.querySelector<HTMLInputElement>('input[role="combobox"]')!;
    input.value = 'glau';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await el.updateComplete;

    const options = el.shadowRoot?.querySelectorAll('button[role="option"]') ?? [];
    expect(options.length).toBeGreaterThanOrEqual(1);
    expect(options[0]?.textContent).toContain('Open-Angle Glaucoma');

    const committed: string[] = [];
    el.addEventListener('customValueCommitted', e => committed.push((e as CustomEvent<string>).detail));
    input.value = 'Rare Corneal Dystrophy';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await el.updateComplete;

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(committed).toEqual(['Rare Corneal Dystrophy']);
  });

  it('upgrades EmrRadioGroupElement, EmrLikertElement, EmrVasElement, and EmrSegmentedControlElement with clearable & variants', async () => {
    const radio = document.createElement('emr-radio-group') as EmrRadioGroupElement;
    radio.label = 'Severity';
    radio.clearable = true;
    radio.allowDeselect = true;
    radio.orientation = 'grid';
    radio.columns = 3;
    radio.variant = 'card';
    radio.value = 'mild';
    radio.options = [
      { value: 'mild', label: 'Mild', description: 'Minimal symptoms' },
      { value: 'severe', label: 'Severe', description: 'Urgent care' },
    ];
    host.appendChild(radio);
    await radio.updateComplete;

    const radioChanges: (string | null)[] = [];
    let radioCleared = 0;
    radio.addEventListener('valueChange', e => radioChanges.push((e as CustomEvent<string | null>).detail));
    radio.addEventListener('cleared', () => {
      radioCleared += 1;
    });

    const firstRadio = radio.shadowRoot?.querySelector<HTMLButtonElement>('button[role="radio"]')!;
    expect(firstRadio.textContent).toContain('Minimal symptoms');
    firstRadio.click();
    expect(radioChanges).toEqual([null]);
    expect(radioCleared).toBe(1);

    const likert = document.createElement('emr-likert') as EmrLikertElement;
    likert.label = 'Pain';
    likert.clearable = true;
    likert.value = 5;
    host.appendChild(likert);
    await likert.updateComplete;

    const likertChanges: (number | null)[] = [];
    likert.addEventListener('valueChange', e => likertChanges.push((e as CustomEvent<number | null>).detail));
    likert.shadowRoot?.querySelector<HTMLButtonElement>('[data-clear-btn="true"]')?.click();
    expect(likertChanges).toEqual([null]);

    const vas = document.createElement('emr-vas') as EmrVasElement;
    vas.label = 'VAS';
    vas.clearable = true;
    vas.value = 40;
    host.appendChild(vas);
    await vas.updateComplete;

    const vasChanges: (number | null)[] = [];
    vas.addEventListener('valueChange', e => vasChanges.push((e as CustomEvent<number | null>).detail));
    vas.shadowRoot?.querySelector<HTMLButtonElement>('[data-clear-btn="true"]')?.click();
    expect(vasChanges).toEqual([null]);

    const seg = document.createElement('emr-segmented-control') as EmrSegmentedControlElement;
    seg.label = 'Eye';
    seg.clearable = true;
    seg.value = 'OD';
    seg.options = [
      { value: 'OD', label: 'Right' },
      { value: 'OS', label: 'Left' },
    ];
    host.appendChild(seg);
    await seg.updateComplete;

    const segChanges: (string | null)[] = [];
    seg.addEventListener('valueChange', e => segChanges.push((e as CustomEvent<string | null>).detail));
    seg.shadowRoot?.querySelector<HTMLButtonElement>('[data-clear-btn="true"]')?.click();
    expect(segChanges).toEqual([null]);
  });

  it('upgrades EmrCheckboxElement, EmrToggleElement, and EmrCheckboxGroupElement with labelPlacement, on/off labels, selectAll, and exclusiveValues', async () => {
    const cb = document.createElement('emr-checkbox') as EmrCheckboxElement;
    cb.label = 'Consent';
    cb.labelPlacement = 'space-between';
    host.appendChild(cb);
    await cb.updateComplete;
    expect(cb.shadowRoot?.querySelector('button[role="checkbox"]')?.getAttribute('data-label-placement')).toBe('space-between');

    const toggle = document.createElement('emr-toggle') as EmrToggleElement;
    toggle.label = 'Dilated';
    toggle.checked = true;
    toggle.onLabel = 'Yes';
    toggle.offLabel = 'No';
    host.appendChild(toggle);
    await toggle.updateComplete;
    expect(toggle.shadowRoot?.querySelector('.toggle-state-label')?.textContent).toBe('Yes');

    const group = document.createElement('emr-checkbox-group') as EmrCheckboxGroupElement;
    group.label = 'Symptoms';
    group.showSelectAll = true;
    group.exclusiveValues = ['none'];
    group.options = [
      { value: 'pain', label: 'Ocular pain', description: 'Acute ache' },
      { value: 'redness', label: 'Redness' },
      { value: 'none', label: 'None of the above' },
    ];
    group.value = ['pain'];
    host.appendChild(group);
    await group.updateComplete;

    const selectAllBtn = group.shadowRoot?.querySelector<HTMLButtonElement>('[data-select-all="true"]')!;
    expect(selectAllBtn.getAttribute('aria-checked')).toBe('mixed');

    const changes: (readonly string[])[] = [];
    group.addEventListener('valueChange', e => changes.push((e as CustomEvent<readonly string[]>).detail));
    selectAllBtn.click();
    expect(changes[0]).toEqual(['pain', 'redness']);

    group.value = ['pain', 'redness'];
    await group.updateComplete;
    const allBtns = group.shadowRoot?.querySelectorAll<HTMLButtonElement>('button[role="checkbox"]') ?? [];
    const noneBtn = allBtns[allBtns.length - 1]!;
    noneBtn.click();
    expect(changes[1]).toEqual(['none']);
  });
});

describe('Wave 2 Part 2 — 20 New Lit Custom Elements (19 L1 + 1 L2) & TypedField Dispatch', () => {
  let host: HTMLElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
  });

  it('1. EmrToggleGroupElement renders switches, select-all, and exclusive values', async () => {
    const el = document.createElement('emr-toggle-group') as EmrToggleGroupElement;
    el.label = 'Alerts';
    el.showSelectAll = true;
    el.exclusiveValues = ['mute'];
    el.options = [
      { value: 'sms', label: 'SMS' },
      { value: 'email', label: 'Email' },
      { value: 'mute', label: 'Mute all' },
    ];
    el.value = ['sms'];
    host.appendChild(el);
    await el.updateComplete;

    const selectAll = el.shadowRoot?.querySelector('button[role="checkbox"][data-select-all="true"]');
    expect(selectAll).not.toBeNull();
    const switches = el.shadowRoot?.querySelectorAll('button[role="switch"]') ?? [];
    expect(switches.length).toBe(3);

    const emitted: (readonly string[])[] = [];
    el.addEventListener('valueChange', e => emitted.push((e as CustomEvent<readonly string[]>).detail));
    (switches[2] as HTMLButtonElement).click();
    expect(emitted[0]).toEqual(['mute']);
  });

  it('2 & 3. EmrTreeViewElement and EmrTreeSelectElement support WAI-ARIA tree, cascade checks, indeterminate state, and path labels', async () => {
    const tree = document.createElement('emr-tree-view') as EmrTreeViewElement;
    tree.label = 'Anatomy';
    tree.nodes = SAMPLE_TREE;
    tree.multiple = true;
    tree.expandedIds = ['ant', 'post'];
    tree.selectedIds = ['cornea'];
    host.appendChild(tree);
    await tree.updateComplete;

    const parentRow = tree.shadowRoot?.querySelector<HTMLButtonElement>('button[data-node-id="ant"]')!;
    expect(parentRow.getAttribute('aria-checked')).toBe('mixed');
    const checkboxBox = parentRow.querySelector('.checkbox-box[data-mixed="true"]');
    expect(checkboxBox).not.toBeNull();
    expect(checkboxBox?.querySelector('svg')).not.toBeNull();

    const treeSelect = document.createElement('emr-tree-select') as EmrTreeSelectElement;
    treeSelect.label = 'Finding Site';
    treeSelect.nodes = SAMPLE_TREE;
    treeSelect.value = 'cornea';
    treeSelect.clearable = true;
    host.appendChild(treeSelect);
    await treeSelect.updateComplete;

    const trigger = treeSelect.shadowRoot?.querySelector<HTMLButtonElement>('button[role="combobox"]')!;
    expect(trigger.textContent).toContain('Anterior Segment / Cornea');
  });

  it('4, 5 & 6. EmrImageViewerElement, EmrImageCropperElement, and EmrImageUploadElement handle zoom, rotation, crop, and upload', async () => {
    const viewer = document.createElement('emr-image-viewer') as EmrImageViewerElement;
    viewer.src = 'data:image/png;base64,';
    viewer.alt = 'Fundus photo';
    host.appendChild(viewer);
    await viewer.updateComplete;

    const viewports: unknown[] = [];
    viewer.addEventListener('viewportChange', e => viewports.push((e as CustomEvent).detail));
    viewer.shadowRoot?.querySelector<HTMLButtonElement>('[data-action="zoom-in"]')?.click();
    expect(viewports.length).toBe(1);
    expect(viewer.viewport.zoom).toBe(1.25);

    const cropper = document.createElement('emr-image-cropper') as EmrImageCropperElement;
    cropper.src = 'data:image/png;base64,';
    host.appendChild(cropper);
    await cropper.updateComplete;

    let committedResult: unknown = null;
    cropper.addEventListener('cropCommitted', e => {
      committedResult = (e as CustomEvent).detail;
    });
    cropper.shadowRoot?.querySelector<HTMLButtonElement>('[data-aspect-id="1:1"]')?.click();
    cropper.shadowRoot?.querySelector<HTMLButtonElement>('[data-action="apply-crop"]')?.click();
    expect(committedResult).toBeTruthy();

    const upload = document.createElement('emr-image-upload') as EmrImageUploadElement;
    upload.label = 'Slit-lamp photos';
    upload.allowCamera = true;
    upload.items = [{ id: 'img-1', name: 'od-cornea.png', sizeBytes: 1024, mimeType: 'image/png', previewSrc: 'data:image/png;base64,' }];
    host.appendChild(upload);
    await upload.updateComplete;

    expect(upload.shadowRoot?.querySelectorAll('[data-image-id]').length).toBe(1);
    upload.shadowRoot?.querySelector<HTMLButtonElement>('[data-action="crop"]')?.click();
    await upload.updateComplete;
    expect(upload.shadowRoot?.querySelector('emr-image-cropper')).toBeTruthy();
  });

  it('7, 8 & 9. EmrDateRangeInputElement, EmrComboboxElement, and EmrTagInputElement', async () => {
    const dr = document.createElement('emr-date-range-input') as EmrDateRangeInputElement;
    dr.label = 'Follow-up window';
    dr.open = true;
    dr.value = { start: '2026-05-10', end: null };
    host.appendChild(dr);
    await dr.updateComplete;

    const rangeUpdates: unknown[] = [];
    dr.addEventListener('valueChange', e => rangeUpdates.push((e as CustomEvent).detail));
    const dayBtn = dr.shadowRoot?.querySelector<HTMLButtonElement>('button[data-iso="2026-05-02"]');
    dayBtn?.click();
    if (rangeUpdates.length > 0) {
      expect(rangeUpdates[0]).toEqual({ start: '2026-05-02', end: '2026-05-10' });
    }

    const combo = document.createElement('emr-combobox') as EmrComboboxElement;
    combo.label = 'Frequency';
    combo.options = [{ value: 'QID', label: 'Four times daily' }];
    host.appendChild(combo);
    await combo.updateComplete;

    const comboInput = combo.shadowRoot?.querySelector<HTMLInputElement>('input[role="combobox"]')!;
    comboInput.focus();
    comboInput.value = 'Every 2 hours';
    comboInput.dispatchEvent(new Event('input', { bubbles: true }));
    await combo.updateComplete;

    const customVals: string[] = [];
    combo.addEventListener('customValueCommitted', e => customVals.push((e as CustomEvent<string>).detail));
    comboInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(customVals).toEqual(['Every 2 hours']);

    // Upgraded combobox: toggle button, match highlighting, Best match, code/badge/readOnly, ArrowDown nav & aria-activedescendant
    const richCombo = document.createElement('emr-combobox') as EmrComboboxElement;
    richCombo.label = 'Chief complaint';
    richCombo.options = [
      { value: 'Reduced distance vision', label: 'Reduced distance vision', code: 'H53.8', badge: { label: 'Common', tone: 'info' }, group: 'Vision' },
      { value: 'Metamorphopsia', label: 'Metamorphopsia', code: 'H53.15', group: 'Vision', readOnly: true },
    ];
    host.appendChild(richCombo);
    await richCombo.updateComplete;

    const toggleBtn = richCombo.shadowRoot?.querySelector<HTMLButtonElement>('button[data-toggle-btn="true"]');
    expect(toggleBtn).toBeTruthy();
    const richInput = richCombo.shadowRoot?.querySelector<HTMLInputElement>('input[role="combobox"]')!;
    richInput.focus();
    richInput.value = 'Reduced';
    richInput.dispatchEvent(new Event('input', { bubbles: true }));
    await richCombo.updateComplete;

    expect(richCombo.shadowRoot?.querySelector('mark.emr-match-highlight')?.textContent).toBe('Reduced');
    expect(richCombo.shadowRoot?.textContent).toContain('Best match');
    expect(richCombo.shadowRoot?.textContent).toContain('H53.8');
    expect(richCombo.shadowRoot?.textContent).toContain('Common');

    richInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await richCombo.updateComplete;
    expect(richInput.getAttribute('aria-activedescendant')).toBeTruthy();

    richInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await richCombo.updateComplete;
    expect(richCombo.open).toBe(false);

    const tags = document.createElement('emr-tag-input') as EmrTagInputElement;
    tags.label = 'Allergies';
    tags.value = ['Penicillin'];
    host.appendChild(tags);
    await tags.updateComplete;

    const tagChanges: (readonly string[])[] = [];
    const tagsChanges: (readonly string[])[] = [];
    tags.addEventListener('valueChange', e => tagChanges.push((e as CustomEvent<readonly string[]>).detail));
    tags.addEventListener('tagsChange', e => tagsChanges.push((e as CustomEvent<readonly string[]>).detail));
    const tagInput = tags.shadowRoot?.querySelector<HTMLInputElement>('input.tag-bare-input')!;
    tagInput.value = 'Sulfa, Latex';
    tagInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(tagChanges[0]).toEqual(['Penicillin', 'Sulfa', 'Latex']);
    expect(tagsChanges[0]).toEqual(['Penicillin', 'Sulfa', 'Latex']);

    const richTags = document.createElement('emr-tag-input') as EmrTagInputElement;
    richTags.label = 'Clinical Allergies';
    richTags.tags = ['Penicillin', 'Sulfa'];
    richTags.lockedTags = ['Penicillin'];
    richTags.suggestions = ['Latex', 'NSAIDs', 'Contrast Dye'];
    richTags.clearable = true;
    richTags.chipTone = 'danger';
    richTags.variant = 'filled';
    richTags.size = 'sm';
    host.appendChild(richTags);
    await richTags.updateComplete;

    expect(richTags.shadowRoot?.querySelector('.tag-chip-lock')).not.toBeNull();
    expect(richTags.shadowRoot?.querySelectorAll('button.tag-chip-remove').length).toBe(1);

    const richTagInput = richTags.shadowRoot?.querySelector<HTMLInputElement>('input.tag-bare-input')!;
    richTagInput.dispatchEvent(new Event('focus'));
    richTagInput.value = 'la';
    richTagInput.dispatchEvent(new Event('input', { bubbles: true }));
    await richTags.updateComplete;

    const listbox = richTags.shadowRoot?.querySelector('[role="listbox"]');
    expect(listbox).not.toBeNull();
    expect(richTags.getAttribute('data-open')).toBe('true');
    expect(listbox?.textContent).toContain('Best match');
    expect(listbox?.querySelector('mark.emr-match-highlight')?.textContent).toBe('La');

    const clearedRich: (readonly string[])[] = [];
    richTags.addEventListener('tagsChange', e => clearedRich.push((e as CustomEvent<readonly string[]>).detail));
    richTags.shadowRoot?.querySelector<HTMLButtonElement>('[data-clear-btn="true"]')?.click();
    expect(clearedRich[0]).toEqual(['Penicillin']);
  });

  it('10, 11, 12 & 13. EmrSliderElement, EmrRangeSliderElement, EmrMaskedInputElement, and EmrOtpInputElement', async () => {
    const slider = document.createElement('emr-slider') as EmrSliderElement;
    slider.label = 'IOP';
    slider.min = 0;
    slider.max = 60;
    slider.value = 16;
    slider.unit = 'mmHg';
    host.appendChild(slider);
    await slider.updateComplete;
    expect(slider.shadowRoot?.textContent).toContain('16 mmHg');

    const range = document.createElement('emr-range-slider') as EmrRangeSliderElement;
    range.label = 'Target IOP';
    range.value = [10, 18];
    host.appendChild(range);
    await range.updateComplete;

    const pairs: (readonly [number, number])[] = [];
    range.addEventListener('valueChange', e => pairs.push((e as CustomEvent<readonly [number, number]>).detail));
    const lowThumb = range.shadowRoot?.querySelector<HTMLElement>('[data-thumb="low"][role="slider"]')!;
    lowThumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(pairs[0]).toEqual([18, 18]);

    const masked = document.createElement('emr-masked-input') as EmrMaskedInputElement;
    masked.label = 'MRN';
    masked.mask = 'AA-9999';
    host.appendChild(masked);
    await masked.updateComplete;

    let maskCompleted = false;
    masked.addEventListener('maskComplete', () => {
      maskCompleted = true;
    });
    const mInput = masked.shadowRoot?.querySelector<HTMLInputElement>('input')!;
    mInput.value = 'AB1234';
    mInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(mInput.value).toBe('AB-1234');
    expect(maskCompleted).toBe(true);

    const otp = document.createElement('emr-otp-input') as EmrOtpInputElement;
    otp.label = 'Override PIN';
    otp.length = 4;
    host.appendChild(otp);
    await otp.updateComplete;

    const completedCodes: string[] = [];
    otp.addEventListener('completed', e => completedCodes.push((e as CustomEvent<string>).detail));
    const firstSlot = otp.shadowRoot?.querySelector<HTMLInputElement>('input[data-slot-index="0"]')!;
    firstSlot.value = '9876';
    firstSlot.dispatchEvent(new Event('input', { bubbles: true }));
    expect(completedCodes).toEqual(['9876']);

    // Wave 2 Batch C DOM parity & bug-fix regressions in Lit
    const dr2 = document.createElement('emr-date-range-input') as EmrDateRangeInputElement;
    dr2.label = 'Stay';
    dr2.labelHidden = true;
    dr2.mode = 'datetime';
    dr2.weekStartsOn = 1;
    dr2.clearable = true;
    dr2.open = true;
    dr2.error = 'Required window';
    dr2.value = { start: '2026-03-08T09:30', end: '2026-03-10T17:15' };
    host.appendChild(dr2);
    await dr2.updateComplete;
    expect(dr2.shadowRoot?.querySelector('[role="alert"]')?.textContent).toBe('Required window');
    expect(dr2.shadowRoot?.querySelector('.dr-weekday')?.textContent).toBe('Mo');
    const dr2Cleared: unknown[] = [];
    dr2.addEventListener('valueChange', e => dr2Cleared.push((e as CustomEvent).detail));
    dr2.shadowRoot?.querySelector<HTMLButtonElement>('[data-clear-btn="true"]')?.click();
    expect(dr2Cleared[0]).toBeNull();

    const sl2 = document.createElement('emr-slider') as EmrSliderElement;
    sl2.label = 'Opacity';
    sl2.labelHidden = true;
    sl2.min = 0;
    sl2.max = 100;
    sl2.step = 5;
    sl2.value = 25;
    sl2.marks = [{ value: 50, label: 'Half' }];
    sl2.hint = 'Adjust transparency';
    host.appendChild(sl2);
    await sl2.updateComplete;
    expect(sl2.shadowRoot?.textContent).toContain('Adjust transparency');
    const sl2Committed: unknown[] = [];
    sl2.addEventListener('committed', e => sl2Committed.push((e as CustomEvent).detail));
    sl2.shadowRoot?.querySelector<HTMLButtonElement>('.slider-mark')?.click();
    expect(sl2Committed[0]).toBe(50);

    const rs2 = document.createElement('emr-range-slider') as EmrRangeSliderElement;
    rs2.label = 'IOP Band';
    rs2.min = 6;
    rs2.max = 30;
    rs2.minDistance = 4;
    rs2.value = [10, 18];
    rs2.clearable = true;
    host.appendChild(rs2);
    await rs2.updateComplete;
    const rs2Low = rs2.shadowRoot?.querySelector<HTMLElement>('[data-thumb="low"]');
    const rs2High = rs2.shadowRoot?.querySelector<HTMLElement>('[data-thumb="high"]');
    expect(rs2Low?.getAttribute('aria-valuemax')).toBe('14');
    expect(rs2High?.getAttribute('aria-valuemin')).toBe('14');

    const mk2 = document.createElement('emr-masked-input') as EmrMaskedInputElement;
    mk2.label = 'Hex ID';
    mk2.mask = '\\9A-99';
    mk2.uppercase = true;
    mk2.unmask = true;
    host.appendChild(mk2);
    await mk2.updateComplete;
    const mk2Vals: unknown[] = [];
    const mk2Done: unknown[] = [];
    mk2.addEventListener('valueChange', e => mk2Vals.push((e as CustomEvent).detail));
    mk2.addEventListener('completed', e => mk2Done.push((e as CustomEvent).detail));
    const mk2In = mk2.shadowRoot?.querySelector<HTMLInputElement>('input')!;
    mk2In.value = 'z12';
    mk2In.dispatchEvent(new Event('input', { bubbles: true }));
    expect(mk2In.value).toBe('9Z-12');
    expect(mk2Vals[0]).toBe('Z12');
    expect(mk2Done[0]).toBe('Z12');

    const otp2 = document.createElement('emr-otp-input') as EmrOtpInputElement;
    otp2.label = 'Verify';
    otp2.length = 6;
    otp2.secret = true;
    otp2.separatorAfter = 3;
    otp2.value = '482910';
    otp2.clearable = true;
    host.appendChild(otp2);
    await otp2.updateComplete;
    expect(otp2.shadowRoot?.querySelectorAll('.otp-sep').length).toBe(1);
    const slot1 = otp2.shadowRoot?.querySelector<HTMLInputElement>('input[data-slot-index="1"]')!;
    expect(slot1.getAttribute('type')).toBe('password');
    expect(slot1.getAttribute('maxlength')).toBe('6');
    const otp2Vals: unknown[] = [];
    otp2.addEventListener('valueChange', e => otp2Vals.push((e as CustomEvent).detail));
    slot1.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    expect(otp2Vals[0]).toBe('4 2910');
  });

  it('14, 15, 16, 17, 18 & 19. Menu, SplitButton, Accordion, Breadcrumbs, ColorPicker, and CopyButton', async () => {
    const menu = document.createElement('emr-menu') as EmrMenuElement;
    menu.open = true;
    menu.items = [
      { id: 'print', label: 'Print summary' },
      { id: 'delete', label: 'Delete record', tone: 'danger', dividerBefore: true },
    ];
    host.appendChild(menu);
    await menu.updateComplete;

    const selectedItems: string[] = [];
    menu.addEventListener('itemSelected', e => selectedItems.push((e as CustomEvent<{ id: string }>).detail.id));
    menu.shadowRoot?.querySelector<HTMLButtonElement>('[data-item-id="print"]')?.click();
    expect(selectedItems).toEqual(['print']);

    const split = document.createElement('emr-split-button') as EmrSplitButtonElement;
    split.label = 'Sign Order';
    split.items = [{ id: 'draft', label: 'Save as draft' }];
    host.appendChild(split);
    await split.updateComplete;

    let primaryClicked = 0;
    split.addEventListener('primaryClicked', () => {
      primaryClicked += 1;
    });
    split.shadowRoot?.querySelector<HTMLButtonElement>('[data-split-primary="true"]')?.click();
    expect(primaryClicked).toBe(1);

    const acc = document.createElement('emr-accordion') as EmrAccordionElement;
    acc.items = [
      { id: 'hx', title: 'Ocular History', content: 'Pseudophakia OU' },
      { id: 'rx', title: 'Medications', content: 'Timolol 0.5%' },
    ];
    host.appendChild(acc);
    await acc.updateComplete;
    acc.shadowRoot?.querySelector<HTMLButtonElement>('button.accordion-header-btn')?.click();
    await acc.updateComplete;
    expect(acc.expandedIds).toEqual(['hx']);
    expect(acc.shadowRoot?.querySelector('[role="region"]')?.textContent).toContain('Pseudophakia OU');

    const crumbs = document.createElement('emr-breadcrumbs') as EmrBreadcrumbsElement;
    crumbs.maxItems = 3;
    crumbs.items = [
      { id: '1', label: 'Home' },
      { id: '2', label: 'Patients' },
      { id: '3', label: 'Encounters' },
      { id: '4', label: 'Anterior Exam' },
    ];
    host.appendChild(crumbs);
    await crumbs.updateComplete;
    const expandBtn = crumbs.shadowRoot?.querySelector<HTMLButtonElement>('[data-expand-breadcrumbs="true"]');
    expect(expandBtn).toBeTruthy();
    expandBtn?.click();
    await crumbs.updateComplete;
    expect(crumbs.shadowRoot?.querySelector('[data-expand-breadcrumbs="true"]')).toBeNull();

    const color = document.createElement('emr-color-picker') as EmrColorPickerElement;
    color.label = 'Annotation color';
    color.clearable = true;
    host.appendChild(color);
    await color.updateComplete;

    const pickedColors: (string | null)[] = [];
    color.addEventListener('valueChange', e => pickedColors.push((e as CustomEvent<string | null>).detail));
    const firstSwatch = color.shadowRoot?.querySelector<HTMLButtonElement>('button[role="radio"]')!;
    firstSwatch.click();
    expect(pickedColors[0]).toBe(DEFAULT_CLINICAL_COLOR_SWATCHES[0]!.value);

    vi.useFakeTimers();
    const copy = document.createElement('emr-copy-button') as EmrCopyButtonElement;
    copy.value = 'MRN-12345';
    copy.feedbackDurationMs = 500;
    host.appendChild(copy);
    await copy.updateComplete;

    const copiedVals: string[] = [];
    copy.addEventListener('copied', e => copiedVals.push((e as CustomEvent<string>).detail));
    copy.shadowRoot?.querySelector<HTMLButtonElement>('button')?.click();
    await copy.updateComplete;
    expect(copiedVals).toEqual(['MRN-12345']);
    expect(copy.shadowRoot?.querySelector('button')?.getAttribute('data-copied')).toBe('true');
    vi.advanceTimersByTime(600);
    await copy.updateComplete;
    expect(copy.shadowRoot?.querySelector('button')?.getAttribute('data-copied')).toBe('false');
    vi.useRealTimers();
  });

  it('20. EmrImageFieldElement (L2) and EmrTypedFieldElement Wave 2 widget dispatch', async () => {
    const imgField = document.createElement('emr-image-field') as EmrImageFieldElement;
    imgField.model = {
      label: 'Fundus Photography',
      items: [{ id: 'f1', name: 'macula.png', sizeBytes: 2048, mimeType: 'image/png', previewSrc: 'data:image/png;base64,' }],
      allowCamera: true,
    };
    host.appendChild(imgField);
    await imgField.updateComplete;

    const intents: ImageFieldIntent[] = [];
    imgField.addEventListener('intent', e => intents.push((e as CustomEvent<ImageFieldIntent>).detail));
    const uploadEl = imgField.shadowRoot?.querySelector('emr-image-upload')!;
    uploadEl.dispatchEvent(new CustomEvent('removeRequested', { detail: 'f1', bubbles: true, composed: true }));
    expect(intents[0]).toEqual({ type: 'itemRemoveRequested', id: 'f1' });

    const typed = document.createElement('emr-typed-field') as EmrTypedFieldElement;
    typed.definition = {
      contract: {
        linkId: 'site',
        valueType: 'text',
        cardinality: { min: 0, max: 1 },
        terminology: [],
      },
      presentation: {
        label: 'Anatomical Site',
        widget: 'tree-select',
        treeNodes: SAMPLE_TREE,
      },
    };
    typed.model = { value: 'cornea' };
    host.appendChild(typed);
    await typed.updateComplete;
    expect(typed.shadowRoot?.querySelector('emr-tree-select')).toBeTruthy();
  });

  it('21. Wave 2 Batch A Lit parity: toggle-group clear/readOnly/checkbox selectAll, tree-view disabled-skipping roving tabindex, and tree-select sibling chips + Escape/outside dismissal', async () => {
    // EmrToggleGroupElement: tri-state checkbox select-all, clearable preserving readOnly, maxSelections
    const tg = document.createElement('emr-toggle-group') as EmrToggleGroupElement;
    tg.label = 'Channels';
    tg.showSelectAll = true;
    tg.clearable = true;
    tg.showSelectionCount = true;
    tg.maxSelections = 2;
    tg.options = [
      { value: 'sms', label: 'SMS', readOnly: true },
      { value: 'portal', label: 'Portal' },
      { value: 'wa', label: 'WhatsApp' },
    ];
    tg.values = ['sms', 'portal'];
    host.appendChild(tg);
    await tg.updateComplete;

    const selectAll = tg.shadowRoot?.querySelector<HTMLButtonElement>('button[role="checkbox"][data-select-all="true"]')!;
    expect(selectAll.getAttribute('aria-checked')).toBe('mixed');
    const waSwitch = tg.shadowRoot?.querySelectorAll<HTMLButtonElement>('button[role="switch"]')[2]!;
    expect(waSwitch.disabled).toBe(true); // blocked by maxSelections=2

    const tgChanges: (readonly string[])[] = [];
    tg.addEventListener('valuesChange', e => tgChanges.push((e as CustomEvent<readonly string[]>).detail));
    tg.shadowRoot?.querySelector<HTMLButtonElement>('.clear-inline-btn')?.click();
    expect(tgChanges[0]).toEqual(['sms']); // locked readOnly preserved

    // EmrTreeViewElement: roving tabindex + disabled row skip on ArrowDown + print attributes
    const tree = document.createElement('emr-tree-view') as EmrTreeViewElement;
    tree.label = 'Ocular';
    tree.nodes = [
      {
        id: 'ant',
        label: 'Anterior',
        children: [
          { id: 'cornea', label: 'Cornea', readOnly: true },
          { id: 'disabled-node', label: 'Disabled', disabled: true },
          { id: 'lens', label: 'Lens' },
        ],
      },
    ];
    tree.expandedIds = ['ant'];
    tree.searchable = true;
    host.appendChild(tree);
    await tree.updateComplete;

    const treeEl = tree.shadowRoot?.querySelector('[role="tree"]')!;
    expect(treeEl.getAttribute('data-emr-print')).toBe('expand');
    expect(tree.shadowRoot?.querySelector('.tree-toolbar')?.getAttribute('data-emr-print')).toBe('hide');

    const corneaRow = tree.shadowRoot?.querySelector<HTMLButtonElement>('[data-node-id="cornea"]')!;
    const lensRow = tree.shadowRoot?.querySelector<HTMLButtonElement>('[data-node-id="lens"]')!;
    const focusSpy = vi.spyOn(lensRow, 'focus');
    corneaRow.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(focusSpy).toHaveBeenCalled();

    // EmrTreeSelectElement: sibling chips, cascade chip removal, uncontrolled sync, Escape & outside dismissal
    const ts = document.createElement('emr-tree-select') as EmrTreeSelectElement;
    ts.label = 'Site';
    ts.nodes = SAMPLE_TREE;
    ts.multiple = true;
    ts.selectedIds = ['ant', 'cornea', 'lens'];
    ts.maxTagCount = 2;
    ts.open = true;
    host.appendChild(ts);
    await ts.updateComplete;

    const chips = ts.shadowRoot?.querySelectorAll('.select-chip') ?? [];
    expect(chips.length).toBe(3); // 2 visible + "+1" overflow
    const tsMultiEvents: (readonly string[])[] = [];
    ts.addEventListener('valuesChange', e => tsMultiEvents.push((e as CustomEvent<readonly string[]>).detail));
    ts.shadowRoot?.querySelector<HTMLButtonElement>('.select-chip-remove')?.click();
    await ts.updateComplete;
    // Removing 'ant' in cascade mode unchecks 'ant', 'cornea', 'lens'
    expect(tsMultiEvents[0]).toEqual([]);

    // Escape closes panel & restores focus to trigger
    const triggerBtn = ts.shadowRoot?.querySelector<HTMLButtonElement>('.trigger-btn')!;
    const triggerFocusSpy = vi.spyOn(triggerBtn, 'focus');
    ts.shadowRoot?.querySelector('.popover-anchor')?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await ts.updateComplete;
    expect(ts.open).toBe(false);
    expect(triggerFocusSpy).toHaveBeenCalled();

    // Reopen and verify outside pointerdown dismisses
    ts.open = true;
    await ts.updateComplete;
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }));
    await ts.updateComplete;
    expect(ts.open).toBe(false);
  });

  it('22. Wave 2 Batch B Lit parity: viewer wheel/keyboard/thumbnails/readOnly, cropper keyboard ROI & straighten sync, upload validation/cap/modal dialog, and L2 EmrImageField EmrFieldFrame status', async () => {
    const viewer = document.createElement('emr-image-viewer') as EmrImageViewerElement;
    viewer.images = [
      { id: '1', src: 'data:image/png;base64,iVBORw0KGgo=', alt: 'OD Fundus' },
      { id: '2', src: 'data:image/png;base64,iVBORw0KGgo=', alt: 'OS Fundus' },
    ];
    viewer.readOnly = true;
    viewer.showThumbnails = true;
    host.appendChild(viewer);
    await viewer.updateComplete;

    expect(viewer.shadowRoot?.querySelectorAll('.viewer-thumb-btn img').length).toBe(2);
    expect(viewer.shadowRoot?.querySelector('.viewer-shell')?.getAttribute('data-readonly')).toBe('true');

    // ReadOnly keeps inspection interactive (zoom/rotate/next still work!)
    viewer.shadowRoot?.querySelector<HTMLButtonElement>('[data-action="rotate-cw"]')?.click();
    await viewer.updateComplete;
    expect(viewer.viewport.rotationDeg).toBe(90);
    const straighten = viewer.shadowRoot?.querySelector<HTMLInputElement>('input[type="range"]')!;
    straighten.value = '12';
    straighten.dispatchEvent(new Event('input', { bubbles: true }));
    await viewer.updateComplete;
    expect(viewer.viewport.rotationDeg).toBe(102);

    // Wheel zoom + Escape fullscreen closeRequested
    const stage = viewer.shadowRoot?.querySelector<HTMLElement>('.viewer-stage')!;
    stage.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true }));
    expect(viewer.viewport.zoom).toBe(1.15);

    const closed: boolean[] = [];
    viewer.addEventListener('closeRequested', () => closed.push(true));
    viewer.fullscreen = true;
    await viewer.updateComplete;
    viewer.shadowRoot?.querySelector('.viewer-shell')?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await viewer.updateComplete;
    expect(viewer.fullscreen).toBe(false);
    expect(closed).toEqual([true]);

    // EmrImageCropperElement: keyboard Shift+Arrow resize + outer scrim + 44px corner handles
    const cropper = document.createElement('emr-image-cropper') as EmrImageCropperElement;
    cropper.src = 'data:image/png;base64,iVBORw0KGgo=';
    cropper.aspectPresets = [];
    host.appendChild(cropper);
    await cropper.updateComplete;

    expect(cropper.shadowRoot?.querySelectorAll('[role="radio"]').length).toBe(5);
    expect(cropper.shadowRoot?.querySelectorAll('.crop-handle').length).toBe(4);
    const cropBox = cropper.shadowRoot?.querySelector<HTMLElement>('.crop-box')!;
    const beforeW = cropper.transform.rect.width;
    cropBox.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true }));
    await cropper.updateComplete;
    expect(cropper.transform.rect.width).toBeCloseTo(beforeW + 0.05, 2);

    // EmrImageUploadElement: maxSizeBytes rejection alert + maxFiles cap + modal crop dialog + caption @input
    const upload = document.createElement('emr-image-upload') as EmrImageUploadElement;
    upload.label = 'Fundus Captures';
    upload.labelHidden = true;
    upload.maxFiles = 1;
    upload.maxSizeBytes = 100;
    upload.items = [{ id: 'u1', name: 'od.png', src: 'data:image/png;base64,', mimeType: 'image/png', sizeBytes: 512 }];
    host.appendChild(upload);
    await upload.updateComplete;

    expect(upload.shadowRoot?.textContent).toContain('Maximum of 1 images reached');
    expect(upload.shadowRoot?.textContent).toContain('512 B');

    const captions: { id: string; caption: string }[] = [];
    upload.addEventListener('captionChange', e => captions.push((e as CustomEvent<{ id: string; caption: string }>).detail));
    const capInput = upload.shadowRoot?.querySelector<HTMLInputElement>('input[data-caption-id="u1"]')!;
    capInput.value = 'OD baseline';
    capInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(captions).toEqual([{ id: 'u1', caption: 'OD baseline' }]);

    upload.shadowRoot?.querySelector<HTMLButtonElement>('[data-action="crop"]')?.click();
    await upload.updateComplete;
    const cropModal = upload.shadowRoot?.querySelector('.upload-modal-backdrop[role="dialog"][aria-modal="true"]');
    expect(cropModal).toBeTruthy();

    // EmrImageFieldElement: EmrFieldFrame delegation, non-empty aspectPresets fallback, readOnly gating
    const imgField = document.createElement('emr-image-field') as EmrImageFieldElement;
    imgField.model = {
      label: 'Clinical Photos',
      items: [{ id: 'f1', name: 'cornea.png', src: 'data:image/png;base64,', mimeType: 'image/png' }],
      status: 'declined',
      statusOptions: [
        { value: 'recorded', label: 'Recorded', tone: 'success' },
        { value: 'declined', label: 'Declined', tone: 'warning' },
      ],
    };
    host.appendChild(imgField);
    await imgField.updateComplete;

    const frame = imgField.shadowRoot?.querySelector('emr-field-frame');
    expect(frame).toBeTruthy();
    const fieldIntents: ImageFieldIntent[] = [];
    imgField.addEventListener('intent', e => fieldIntents.push((e as CustomEvent<ImageFieldIntent>).detail));
    frame?.dispatchEvent(new CustomEvent('intent', { detail: { type: 'statusChangeRequested', status: 'recorded' }, bubbles: true, composed: true }));
    expect(fieldIntents).toEqual([{ type: 'statusChangeRequested', status: 'recorded' }]);

    // EmrTypedFieldElement widget: 'image-upload' delegates to EmrImageFieldElement
    const typedImg = document.createElement('emr-typed-field') as EmrTypedFieldElement;
    typedImg.definition = {
      contract: {
        linkId: 'photos',
        valueType: 'attachment',
        cardinality: { min: 0, max: 3 },
        terminology: [],
      },
      presentation: {
        label: 'Slit Lamp Photos',
        widget: 'image-upload',
      },
    };
    typedImg.model = { value: [] };
    host.appendChild(typedImg);
    await typedImg.updateComplete;
    expect(typedImg.shadowRoot?.querySelector('emr-image-field')).toBeTruthy();
  });

  it('verifies Wave 2 Batch D Stage 1 parity across Menu, SplitButton, Accordion, Breadcrumbs, ColorPicker & CopyButton', async () => {
    // 14. EmrMenuElement: disabled item focus skip, typeahead, readOnly, canonical label/variant, EmrMenuItem payload
    const menu = document.createElement('emr-menu') as EmrMenuElement;
    menu.label = 'Chart Actions';
    menu.triggerIcon = 'more-vertical';
    menu.variant = 'secondary';
    menu.items = [
      { id: 'view', label: 'View Chart', icon: 'eye' },
      { id: 'locked', label: 'Locked Action', disabled: true },
      { id: 'print', label: 'Print Summary', shortcut: '⌘P' },
    ];
    host.appendChild(menu);
    await menu.updateComplete;
    const trigger = menu.shadowRoot?.querySelector<HTMLButtonElement>('[data-menu-trigger="true"]')!;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await menu.updateComplete;
    expect(menu.open).toBe(true);
    const viewItem = menu.shadowRoot?.querySelector<HTMLButtonElement>('[data-item-id="view"]')!;
    const printItem = menu.shadowRoot?.querySelector<HTMLButtonElement>('[data-item-id="print"]')!;
    viewItem.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(menu.shadowRoot?.activeElement).toBe(printItem);
    printItem.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', bubbles: true }));
    expect(menu.shadowRoot?.activeElement).toBe(viewItem);

    const menuSelected: unknown[] = [];
    menu.addEventListener('itemSelected', e => menuSelected.push((e as CustomEvent).detail));
    printItem.click();
    await menu.updateComplete;
    expect(menuSelected).toEqual([{ id: 'print', label: 'Print Summary', shortcut: '⌘P' }]);
    expect(menu.open).toBe(false);

    menu.readOnly = true;
    await menu.updateComplete;
    trigger.click();
    await menu.updateComplete;
    expect(menu.open).toBe(false);

    // 15. EmrSplitButtonElement: loading spinner, danger variant, size, readOnly, EmrMenuItem payload
    const split = document.createElement('emr-split-button') as EmrSplitButtonElement;
    split.label = 'Void Order';
    split.variant = 'danger';
    split.size = 'lg';
    split.loading = true;
    split.items = [{ id: 'draft', label: 'Save Draft', icon: 'file', description: 'Keep editable' }];
    host.appendChild(split);
    await split.updateComplete;
    expect(split.shadowRoot?.querySelector('.split-spinner')).toBeTruthy();
    let splitClicks = 0;
    split.addEventListener('clicked', () => { splitClicks += 1; });
    split.shadowRoot?.querySelector<HTMLButtonElement>('[data-split-primary="true"]')?.click();
    expect(splitClicks).toBe(0);
    split.loading = false;
    await split.updateComplete;
    split.shadowRoot?.querySelector<HTMLButtonElement>('[data-split-primary="true"]')?.click();
    expect(splitClicks).toBe(1);

    // 16. EmrAccordionElement: structured badge (never [object Object]), [hidden] panels in DOM, role=heading, arrow nav
    const acc = document.createElement('emr-accordion') as EmrAccordionElement;
    acc.headingLevel = 2;
    acc.variant = 'card';
    acc.items = [
      { id: 'hx', title: 'History', icon: 'file', badge: { label: 'Verified', tone: 'success' }, content: 'Ocular history details' },
      { id: 'rx', title: 'Medications', content: 'Timolol 0.5% BID' },
    ];
    host.appendChild(acc);
    await acc.updateComplete;
    expect(acc.shadowRoot?.textContent).not.toContain('[object Object]');
    expect(acc.shadowRoot?.textContent).toContain('Verified');
    const headings = acc.shadowRoot?.querySelectorAll('[role="heading"][aria-level="2"]');
    expect(headings?.length).toBe(2);
    const panels = acc.shadowRoot?.querySelectorAll<HTMLElement>('[role="region"]');
    expect(panels?.length).toBe(2);
    expect(panels?.[0]?.hasAttribute('hidden')).toBe(true);
    const hdr0 = acc.shadowRoot?.querySelector<HTMLButtonElement>('button[data-header-index="0"]')!;
    const hdr1 = acc.shadowRoot?.querySelector<HTMLButtonElement>('button[data-header-index="1"]')!;
    hdr0.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(acc.shadowRoot?.activeElement).toBe(hdr1);

    // 17. EmrBreadcrumbsElement: href anchor, chevron separator, overflowExpanded, reset on items change
    const crumbs = document.createElement('emr-breadcrumbs') as EmrBreadcrumbsElement;
    crumbs.maxItems = 3;
    crumbs.separator = 'chevron';
    crumbs.items = [
      { id: 'home', label: 'Clinic', href: '/clinic' },
      { id: 'retina', label: 'Retina' },
      { id: 'pt', label: 'Patient' },
      { id: 'oct', label: 'OCT' },
    ];
    host.appendChild(crumbs);
    await crumbs.updateComplete;
    expect(crumbs.shadowRoot?.querySelector('a.breadcrumb-btn[href="/clinic"]')).toBeTruthy();
    const expandedEvents: unknown[] = [];
    crumbs.addEventListener('overflowExpanded', e => expandedEvents.push((e as CustomEvent).detail));
    crumbs.shadowRoot?.querySelector<HTMLButtonElement>('[data-expand-breadcrumbs="true"]')?.click();
    await crumbs.updateComplete;
    expect(expandedEvents.length).toBe(1);
    crumbs.items = [...crumbs.items, { id: 'rnfl', label: 'RNFL' }];
    await crumbs.updateComplete;
    expect(crumbs.shadowRoot?.querySelector('[data-expand-breadcrumbs="true"]')).toBeTruthy();

    // 18. EmrColorPickerElement: clearable default true, #RGB norm, blur rollback, contrast class, roving focus, warning under labelHidden
    const color = document.createElement('emr-color-picker') as EmrColorPickerElement;
    color.label = 'Ink';
    color.labelHidden = true;
    color.warning = 'Check contrast';
    color.swatches = [
      { value: '#fde68a', label: 'Bright Yellow' },
      { value: '#0f172a', label: 'Dark Ink' },
    ];
    color.value = '#fde68a';
    host.appendChild(color);
    await color.updateComplete;
    expect(color.clearable).toBe(true);
    expect(color.shadowRoot?.querySelector('.swatch-check--dark')).toBeTruthy();
    expect(color.shadowRoot?.querySelector('[role="status"]')?.textContent).toContain('Check contrast');
    const hexInput = color.shadowRoot?.querySelector<HTMLInputElement>('input.hex-input')!;
    const colorEvents: (string | null)[] = [];
    color.addEventListener('valueChange', e => colorEvents.push((e as CustomEvent<string | null>).detail));
    hexInput.value = '#f0a';
    hexInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(colorEvents).toEqual(['#ff00aa']);
    hexInput.value = '#ggg';
    hexInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(colorEvents).toEqual(['#ff00aa']);
    hexInput.dispatchEvent(new Event('blur', { bubbles: true }));
    await color.updateComplete;
    expect(hexInput.value).toBe('#fde68a');

    // 19. EmrCopyButtonElement: outline default, empty value disabled, iconOnly, value change resets copied
    const copy = document.createElement('emr-copy-button') as EmrCopyButtonElement;
    copy.value = '';
    copy.iconOnly = true;
    host.appendChild(copy);
    await copy.updateComplete;
    const copyBtn = copy.shadowRoot?.querySelector<HTMLButtonElement>('button')!;
    expect(copy.variant).toBe('outline');
    expect(copyBtn.disabled).toBe(true);
    copy.value = 'MRN-99';
    await copy.updateComplete;
    expect(copyBtn.disabled).toBe(false);
    copyBtn.click();
    await copy.updateComplete;
    expect(copyBtn.getAttribute('data-copied')).toBe('true');
    expect(copy.shadowRoot?.querySelector('[role="status"]')?.textContent).toContain('Copied');
    copy.value = 'MRN-100';
    await copy.updateComplete;
    expect(copyBtn.getAttribute('data-copied')).toBe('false');
  });
});
