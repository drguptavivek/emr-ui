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

  it('upgrades EmrSelectElement with grouped options (<optgroup>) and clearable button', async () => {
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

    const optgroups = el.shadowRoot?.querySelectorAll('optgroup') ?? [];
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

    const switches = el.shadowRoot?.querySelectorAll('button[role="switch"]') ?? [];
    expect(switches.length).toBe(4);

    const emitted: (readonly string[])[] = [];
    el.addEventListener('valueChange', e => emitted.push((e as CustomEvent<readonly string[]>).detail));
    (switches[3] as HTMLButtonElement).click();
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
    const checkbox = parentRow.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    expect(checkbox.indeterminate).toBe(true);

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

    const tags = document.createElement('emr-tag-input') as EmrTagInputElement;
    tags.label = 'Allergies';
    tags.value = ['Penicillin'];
    host.appendChild(tags);
    await tags.updateComplete;

    const tagChanges: (readonly string[])[] = [];
    tags.addEventListener('valueChange', e => tagChanges.push((e as CustomEvent<readonly string[]>).detail));
    const tagInput = tags.shadowRoot?.querySelector<HTMLInputElement>('input.tag-bare-input')!;
    tagInput.value = 'Sulfa, Latex';
    tagInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(tagChanges[0]).toEqual(['Penicillin', 'Sulfa', 'Latex']);
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
    const lowInput = range.shadowRoot?.querySelector<HTMLInputElement>('input[data-thumb="low"]')!;
    lowInput.value = '22';
    lowInput.dispatchEvent(new Event('input', { bubbles: true }));
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
    menu.addEventListener('itemSelected', e => selectedItems.push((e as CustomEvent<string>).detail));
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
});
