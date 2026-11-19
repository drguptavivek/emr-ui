// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type {
  AnnotationListViewModel,
  AnnotationToolbarViewModel,
  ClinicalFormViewModel,
  ClinicalListViewModel,
  ClinicalMatrixSchema,
  ClinicalMatrixValues,
  EmrDataTableModel,
  ImageTemplatePickerViewModel,
  RepeatableGroupDefinition,
  RepeatableItemState,
} from '@drguptavivek/emr-controller';
import { registerL6Elements, type EmrThemeCustomizerElement } from './l6-authoring.js';
import { registerL4Elements } from './l4-domain.js';
import {
  registerL3Elements,
  type EmrAnnotationListElement,
  type EmrAnnotationToolbarElement,
  type EmrClinicalCellRendererElement,
  type EmrClinicalFormElement,
  type EmrClinicalListElement,
  type EmrClinicalMatrixElement,
  type EmrDataTableElement,
  type EmrImageTemplatePickerElement,
  type EmrRepeatableGroupElement,
  type EmrSectionCardElement,
  type EmrTimeAxisElement,
} from './l3-structures.js';
import type { EmrTypedFieldElement } from './l2-fields.js';

const mounted: HTMLElement[] = [];
async function mount<T extends HTMLElement & { updateComplete: Promise<boolean> }>(tag: string, properties: Partial<T>) {
  const element = Object.assign(document.createElement(tag) as T, properties);
  mounted.push(element);
  document.body.append(element);
  await element.updateComplete;
  return element;
}

function collect(element: HTMLElement) {
  const intents: unknown[] = [];
  element.addEventListener('intent', (event) => intents.push((event as CustomEvent).detail));
  return intents;
}

afterEach(() => {
  for (const element of mounted.splice(0)) element.remove();
});

describe('Lit structures', () => {
  it('renders the shared form snapshot and forwards each control edit exactly once', async () => {
    registerL3Elements();
    const model: ClinicalFormViewModel = {
      schema: {
        id: 'fixture', label: 'Fixture',
        sections: [{
          id: 'exam', label: 'Exam', collapsible: true,
          blocks: [
            { id: 'checked', type: 'boolean', label: 'Checked' },
            { id: 'hidden', type: 'text', label: 'Hidden' },
            { id: 'retained', type: 'boolean', label: 'Recorded false' },
            { id: 'locked', type: 'text', label: 'Locked' },
            { kind: 'matrix', id: 'matrix', label: 'Matrix',
              columns: [{ id: 'od', label: 'OD' }],
              rows: [{ id: 'measure', label: 'Measurement',
                cells: { od: { id: 'matrix-od', type: 'integer', label: 'OD measurement' } } }],
            },
            { kind: 'repeatable', id: 'visits', label: 'Visits', fields: [{ id: 'note', type: 'text', label: 'Note' }] },
          ],
        }],
      },
      fields: {
        checked: { value: false },
        hidden: { value: null, hidden: true },
        retained: { value: false, hidden: true },
        locked: { value: 'Locked', disabled: true },
        'matrix-od': { value: 5 },
      },
      repeatableGroups: { visits: [{ id: 'one', label: 'First visit', fields: { note: { value: 'Follow-up' } } }] },
    };
    const form = await mount<EmrClinicalFormElement>('emr-clinical-form', { model });
    const fields = [...form.shadowRoot!.querySelectorAll<EmrTypedFieldElement>('emr-typed-field')];
    expect(fields.map((field) => field.definition?.id)).toEqual(['checked', 'retained', 'locked', 'matrix-od']);
    const intents = collect(form);

    await fields[0]!.updateComplete;
    const checkbox = fields[0]!.shadowRoot!.querySelector('emr-checkbox') as HTMLElement & { updateComplete: Promise<boolean> };
    await checkbox.updateComplete;
    checkbox.shadowRoot!.querySelector('button')!.click();
    expect(intents).toEqual([{ type: 'fieldEditRequested', fieldId: 'checked', value: true }]);

    fields[2]!.dispatchEvent(new CustomEvent('valueChange', { bubbles: true, composed: true, detail: 'Rejected' }));
    expect(intents).toHaveLength(1);

    const group = form.shadowRoot!.querySelector<EmrRepeatableGroupElement>('emr-repeatable-group')!;
    await group.updateComplete;
    const repeatField = group.shadowRoot!.querySelector<EmrTypedFieldElement>('emr-typed-field')!;
    expect(repeatField.model?.value).toBe('Follow-up');
    repeatField.dispatchEvent(new CustomEvent('valueChange', { bubbles: true, composed: true, detail: 'Updated' }));
    expect(intents[1]).toEqual({ type: 'repeatItemEditRequested', groupId: 'visits', itemId: 'one', fieldId: 'note', value: 'Updated' });
    expect(intents).toHaveLength(2);

    const section = form.shadowRoot!.querySelector<EmrSectionCardElement>('emr-section-card')!;
    await section.updateComplete;
    section.shadowRoot!.querySelector('button')!.click();
    expect(intents[2]).toEqual({ type: 'sectionToggleRequested', sectionId: 'exam' });
    expect(form.model).toBe(model);
    expect(section.collapsed).toBe(false);
  });

  it('proposes the next table sort, selection, and page without changing the supplied model', async () => {
    registerL3Elements();
    const model: EmrDataTableModel = {
      caption: 'Fixture table',
      columns: [{ id: 'result', label: 'Result', sortable: true }],
      rows: [{ id: 'row-1', cells: { result: 'Fixture row' } }],
      selectedIds: ['other-page'],
      sort: { columnId: 'result', direction: 'asc' },
      filters: [], savedFilters: [], bulkActions: [],
      density: 'comfortable', summaryLabel: '1 of 2', page: 1, pageCount: 2,
      pageSize: 1, pageSizeOptions: [1, 2],
    };
    const table = await mount<EmrDataTableElement>('emr-data-table', { model });
    const intents = collect(table);
    table.shadowRoot!.querySelector<HTMLButtonElement>('th button')!.click();
    const checkbox = table.shadowRoot!.querySelector<HTMLInputElement>('tbody input')!;
    checkbox.click();
    [...table.shadowRoot!.querySelectorAll('button')].find((button) => button.textContent === 'Next')!.click();
    expect(intents).toEqual([
      { type: 'sortChanged', columnId: 'result', direction: 'desc' },
      { type: 'selectionChanged', selectedIds: ['other-page', 'row-1'] },
      { type: 'pageChanged', page: 2 },
    ]);
    expect(checkbox.checked).toBe(false);
    expect(table.model).toBe(model);
  });

  it('supports tri-state select-all, saved-filter menu outside-click/keyboard nav, loading skeleton, density, readOnly gating, and focus/blur on emr-data-table', async () => {
    registerL3Elements();
    const model: EmrDataTableModel = {
      caption: 'Referral registry',
      columns: [
        { id: 'patient', label: 'Patient', sortable: true, width: 180 },
        { id: 'status', label: 'Status', width: '30%' },
      ],
      rows: [
        { id: 'r1', cells: { patient: 'Meera Nair', status: { text: 'Cataract', badge: { label: 'Overdue', tone: 'warning' } } } },
        { id: 'r2', cells: { patient: 'Rohan Iyer', status: { text: 'Glaucoma', badge: { label: 'Booked', tone: 'info' } } } },
      ],
      selectedIds: ['r1'],
      sort: { columnId: 'patient', direction: 'asc' },
      filters: [{ id: 'f1', label: 'Status', valueLabel: 'Overdue' }],
      savedFilters: [{ id: 'sf1', label: 'Overdue > 14 days' }],
      bulkActions: [{ id: 'assign', label: 'Assign' }],
      density: 'comfortable',
      summaryLabel: 'Showing 1-2 of 24',
      page: 1,
      pageCount: 3,
      pageSize: 10,
      pageSizeOptions: [5, 10, 25],
      status: 'ready',
    };

    const table = await mount<EmrDataTableElement>('emr-data-table', {
      model,
      idPrefix: 'ward-c',
      headingId: 'custom-lit-cap',
      labels: { addFilter: 'New filter' },
    });
    const intents = collect(table);
    let focusCount = 0;
    let blurCount = 0;
    table.addEventListener('focused', () => {
      focusCount += 1;
    });
    table.addEventListener('blurred', () => {
      blurCount += 1;
    });

    const shadow = table.shadowRoot!;
    expect(shadow.querySelector('.dt')!.id).toBe('ward-c-emr-data-table');
    expect(shadow.querySelector('caption')!.id).toBe('custom-lit-cap');
    expect(shadow.querySelector('table')!.getAttribute('aria-labelledby')).toBe('custom-lit-cap');
    expect(shadow.querySelector('emr-badge')).not.toBeNull();
    expect(shadow.textContent).not.toMatch(/×|▲|▼|↕/);

    // Tri-state select-all checkbox
    const selectAllCb = shadow.querySelector<HTMLInputElement>('thead input[type="checkbox"]')!;
    expect(selectAllCb.getAttribute('aria-checked')).toBe('mixed');
    expect(selectAllCb.indeterminate).toBe(true);
    selectAllCb.click();
    expect(intents.at(-1)).toEqual({ type: 'selectionChanged', selectedIds: ['r1', 'r2'] });

    // Density toggle & Rows per page
    const compactBtn = [...shadow.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === 'Compact')!;
    compactBtn.click();
    expect(intents.at(-1)).toEqual({ type: 'densityChanged', density: 'compact' });

    const pageSizeSelect = shadow.querySelector<HTMLSelectElement>('select.dt__select')!;
    pageSizeSelect.value = '25';
    pageSizeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    expect(intents.at(-1)).toEqual({ type: 'pageSizeChanged', pageSize: 25 });

    // Saved Filters menu keyboard & outside-click dismissal
    const trigger = shadow.querySelector<HTMLButtonElement>('.dt__menu-trigger')!;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await table.updateComplete;
    const menuItems = [...shadow.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];
    expect(menuItems).toHaveLength(2);
    expect(shadow.activeElement).toBe(menuItems[0]);

    menuItems[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(shadow.activeElement).toBe(menuItems[1]);

    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    await table.updateComplete;
    expect(shadow.querySelector('[role="menu"]')).toBeNull();

    // Focus/blur lifecycle
    const rootDiv = shadow.querySelector<HTMLElement>('.dt')!;
    rootDiv.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    rootDiv.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: trigger }));
    expect(focusCount).toBe(1);
    expect(blurCount).toBe(0);
    rootDiv.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    expect(blurCount).toBe(1);

    // Loading skeleton (5 rows + aria-busy)
    table.model = { ...model, status: 'loading' };
    await table.updateComplete;
    expect(shadow.querySelector('.dt__scroll')!.getAttribute('aria-busy')).toBe('true');
    expect(shadow.querySelectorAll('tr.dt__row--skeleton')).toHaveLength(5);

    // Read-only gating keeps sort/pagination working while gating selection & filter mutations
    table.model = { ...model, readOnly: true };
    await table.updateComplete;
    intents.length = 0;

    shadow.querySelector<HTMLButtonElement>('button.dt__chip-remove')!.click();
    [...shadow.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === 'New filter')!.click();
    [...shadow.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === 'Assign')!.click();
    shadow.querySelector<HTMLInputElement>('tbody input[type="checkbox"]')!.click();
    expect(intents).toEqual([]);

    shadow.querySelector<HTMLButtonElement>('th button.dt__sort-btn')!.click();
    [...shadow.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent === 'Next')!.click();
    expect(intents).toEqual([
      { type: 'sortChanged', columnId: 'patient', direction: 'desc' },
      { type: 'pageChanged', page: 2 },
    ]);
  });

  it('renders a read-only time axis as a focusable ordered list without state-changing controls', async () => {
    registerL3Elements();
    const axis = await mount<EmrTimeAxisElement>('emr-time-axis', {
      model: {
        id: 'axis',
        title: 'Medication rounds',
        ticks: [
          { id: 'morning', label: '08:00', sublabel: 'Day 1', current: true },
          { id: 'noon', label: '12:00', sublabel: 'Day 1' },
        ],
        selectedTickId: 'noon',
        stepLabel: 'Four hourly',
        canShiftLater: true,
        readOnly: true,
      },
      idPrefix: 'ward-ro',
    });
    const scroll = axis.shadowRoot!.querySelector<HTMLElement>('.ta__scroll')!;
    expect(scroll.getAttribute('role')).toBe('region');
    expect(scroll.getAttribute('tabindex')).toBe('0');
    expect(scroll.getAttribute('data-emr-print')).toBe('expand');
    expect(axis.shadowRoot!.querySelector('ol.ta__strip')).not.toBeNull();
    expect(axis.shadowRoot!.textContent).toContain('08:00');
    expect(axis.shadowRoot!.textContent).toContain('Current');
    expect(axis.shadowRoot!.textContent).toContain('Step: Four hourly');
    expect(axis.shadowRoot!.querySelector('button')).toBeNull();
    expect(axis.shadowRoot!.querySelector('select')).toBeNull();
  });

  it('supports interactive time-axis listbox roving tabindex, SVG chevrons, step select, and focus/blur', async () => {
    registerL3Elements();
    const axis = await mount<EmrTimeAxisElement>('emr-time-axis', {
      model: {
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
      },
      idPrefix: 'icu',
      headingId: 'icu-axis-custom-heading',
      labels: { earlier: 'Back', later: 'Forward', step: 'Interval' },
    });

    const section = axis.shadowRoot!.querySelector('section.ta')!;
    expect(section.id).toBe('icu-emr-time-axis-icu-axis');
    expect(section.getAttribute('aria-labelledby')).toBe('icu-axis-custom-heading');
    expect(axis.shadowRoot!.querySelector('h3')!.id).toBe('icu-axis-custom-heading');

    const buttons = [...axis.shadowRoot!.querySelectorAll<HTMLButtonElement>('button.ta__btn')];
    expect(buttons).toHaveLength(2);
    expect(buttons[0]!.hasAttribute('disabled')).toBe(false);
    expect(buttons[0]!.getAttribute('aria-disabled')).toBeNull();
    expect(buttons[0]!.querySelector('svg')).not.toBeNull();
    expect(buttons[1]!.getAttribute('aria-disabled')).toBe('true');
    expect(buttons[1]!.querySelector('svg')).not.toBeNull();

    const strip = axis.shadowRoot!.querySelector<HTMLElement>('[role="listbox"]')!;
    const options = [...axis.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]')];
    expect(options.map((o) => o.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);
    expect(options[1]!.getAttribute('aria-selected')).toBe('true');
    expect(options[1]!.getAttribute('aria-current')).toBe('time');

    const intents = collect(axis);
    strip.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await axis.updateComplete;
    expect(options.map((o) => o.getAttribute('tabindex'))).toEqual(['-1', '-1', '0']);
    strip.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    buttons[0]!.click();
    buttons[1]!.click(); // gated: canShiftLater is false

    const select = axis.shadowRoot!.querySelector<HTMLSelectElement>('select.ta__select')!;
    select.value = '30';
    select.dispatchEvent(new Event('change'));
    expect(select.value).toBe('60'); // controlled reset

    expect(intents).toEqual([
      { type: 'tickSelected', tickId: 't10' },
      { type: 'shiftEarlierRequested' },
      { type: 'stepChangeRequested', stepId: '30' },
    ]);

    let focusCount = 0;
    let blurCount = 0;
    axis.addEventListener('focused', () => {
      focusCount += 1;
    });
    axis.addEventListener('blurred', () => {
      blurCount += 1;
    });
    section.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    expect(blurCount).toBe(1);
    section.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(focusCount).toBe(1);
    section.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: options[0]! }));
    expect(blurCount).toBe(1);
    section.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    expect(blurCount).toBe(2);
  });

  it('restores accepted remarks when a matrix locks while editing', async () => {
    registerL3Elements();
    const matrix = await mount<EmrClinicalMatrixElement>('emr-clinical-matrix', {
      definition: { id: 'matrix', label: 'Matrix', columns: [], rows: [{ id: 'row', label: 'Row', type: 'text' }] },
      model: { row: { cells: {}, remark: 'Accepted' } },
    });
    const input = matrix.shadowRoot!.querySelector<HTMLInputElement>('input')!;
    input.value = 'Unaccepted';
    input.dispatchEvent(new Event('input'));
    matrix.readOnly = true;
    await matrix.updateComplete;
    expect(input.readOnly).toBe(true);
    expect(input.value).toBe('Accepted');
  });

  it('renders standalone <emr-section-card> with canonical props, heading levels, slots, focus events, and readOnly toggleable intent', async () => {
    registerL3Elements();
    const card = await mount<EmrSectionCardElement>('emr-section-card', {
      sectionId: 'anterior',
      label: 'Anterior Segment',
      description: 'Slit-lamp biomicroscopy',
      status: { label: 'Recorded', tone: 'success', icon: 'check' },
      collapsible: true,
      collapsed: true,
      headingId: 'anterior-custom-heading',
      headingLevel: 4,
      variant: 'elevated',
      tone: 'info',
      padding: 'lg',
      icon: 'eye',
      readOnly: true,
    });
    const actionsEl = document.createElement('span');
    actionsEl.slot = 'actions';
    actionsEl.textContent = 'Compare OD/OS';
    const bodyEl = document.createElement('p');
    bodyEl.textContent = 'Cornea clear';
    const footerEl = document.createElement('span');
    footerEl.slot = 'footer';
    footerEl.textContent = 'Verified by resident';
    card.append(actionsEl, bodyEl, footerEl);
    await card.updateComplete;

    const section = card.shadowRoot!.querySelector('section')!;
    expect(section.className).toContain('section-card--elevated');
    expect(section.className).toContain('section-card--pad-lg');
    expect(section.className).toContain('section-card--readonly');
    expect(section.className).toContain('section-card--collapsed');
    expect(section.getAttribute('data-tone')).toBe('info');
    expect(section.getAttribute('aria-labelledby')).toBe('anterior-custom-heading');

    const heading = card.shadowRoot!.querySelector('h4')!;
    expect(heading).not.toBeNull();
    expect(heading.id).toBe('anterior-custom-heading');
    expect(heading.textContent).toBe('Anterior Segment');
    expect(heading.querySelector('button')).toBeNull();

    expect(card.shadowRoot!.querySelector('.section-header-icon svg')).not.toBeNull();
    expect(card.shadowRoot!.querySelector('emr-badge')).not.toBeNull();

    const toggle = card.shadowRoot!.querySelector<HTMLButtonElement>('button.section-toggle')!;
    expect(toggle.disabled).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-controls')).toBe('emr-section-anterior-content');
    expect(toggle.getAttribute('aria-label')).toBe('Show Anterior Segment');
    expect(toggle.textContent?.trim()).toBe('Show');

    const content = card.shadowRoot!.querySelector<HTMLElement>('.section-content')!;
    expect(content.id).toBe('emr-section-anterior-content');
    expect(content.hasAttribute('data-collapsed')).toBe(true);
    expect(content.hasAttribute('hidden')).toBe(true);

    const intents = collect(card);
    toggle.click();
    expect(intents).toEqual([{ type: 'toggleRequested', sectionId: 'anterior' }]);

    let focusCount = 0;
    let blurCount = 0;
    card.addEventListener('focused', () => {
      focusCount += 1;
    });
    card.addEventListener('blurred', () => {
      blurCount += 1;
    });
    section.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(focusCount).toBe(1);
    section.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: toggle }));
    expect(blurCount).toBe(0);
    section.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    expect(blurCount).toBe(1);
  });

  it('renders standalone <emr-repeatable-group> with model, idPrefix, minItems/maxItems, badges, errors, and print attributes', async () => {
    registerL3Elements();
    const definition: RepeatableGroupDefinition = {
      kind: 'repeatable',
      id: 'drops',
      label: 'Post-operative drops',
      description: 'Topical regimen',
      addLabel: 'Add drop',
      emptyMessage: 'No drops configured.',
      minItems: 1,
      maxItems: 2,
      fields: [
        { id: 'drug', label: 'Medication', type: 'text', span: 8 },
        { id: 'dose', label: 'Dose', type: 'quantity', unit: 'drops', span: 4 },
      ],
    };

    const group = await mount<EmrRepeatableGroupElement>('emr-repeatable-group', {
      definition,
      model: [],
      idPrefix: 'opd-',
      emptyMessage: 'Custom empty state.',
      error: 'At least one drop is required',
      warning: 'Verify preservative-free drops',
    });

    const section = group.shadowRoot!.querySelector('section')!;
    expect(section.getAttribute('role')).toBe('region');
    expect(section.getAttribute('aria-labelledby')).toBe('opd-drops-heading');
    expect(group.shadowRoot!.querySelector('h3')!.id).toBe('opd-drops-heading');
    expect(group.shadowRoot!.querySelector('.repeatable-empty')!.textContent).toBe('Custom empty state.');
    expect(group.shadowRoot!.querySelector('[role="alert"]')!.textContent).toBe('At least one drop is required');
    expect(group.shadowRoot!.querySelector('[role="status"]')!.textContent).toBe('Verify preservative-free drops');

    const addBtn = group.shadowRoot!.querySelector<HTMLButtonElement>('button')!;
    expect(addBtn.textContent).toContain('Add drop');
    expect(addBtn.getAttribute('data-emr-print')).toBe('hide');
    expect(addBtn.disabled).toBe(false);

    const intents = collect(group);
    addBtn.click();
    expect(intents).toEqual([{ type: 'repeatItemAddRequested', groupId: 'drops' }]);

    const items: readonly RepeatableItemState[] = [
      {
        id: 'd1',
        label: 'Drop 1',
        readOnly: true,
        badges: [{ label: 'Active', tone: 'success' }],
        warning: 'Monitor IOP',
        fields: {
          drug: { value: 'Timolol' },
          dose: { value: { value: null, unit: 'drops' }, hidden: true },
        },
      },
      {
        id: 'd2',
        label: 'Drop 2',
        error: 'Missing medication name',
        fields: {
          drug: { value: '' },
          dose: { value: { value: 2, unit: 'drops' }, hidden: true },
        },
      },
    ];

    group.model = items;
    group.error = '';
    group.warning = '';
    await group.updateComplete;

    // maxItems reached: Add button replaced by hint
    expect(group.shadowRoot!.querySelector('.repeatable-heading button')).toBeNull();
    expect(group.shadowRoot!.querySelector('.repeatable-limit')?.textContent).toBe('Maximum 2 entries');

    const articles = [...group.shadowRoot!.querySelectorAll('article.repeatable-item')];
    expect(articles).toHaveLength(2);
    expect(articles[0]!.className).toContain('repeatable-item--readonly');
    expect(articles[0]!.className).toContain('repeatable-item--warning');
    expect(articles[0]!.textContent).toContain('Monitor IOP');
    expect(articles[0]!.querySelectorAll('emr-badge')).toHaveLength(2); // Read-only lock badge + Active badge
    expect(articles[0]!.querySelector('button')).toBeNull(); // locked item has no Remove button

    expect(articles[1]!.className).toContain('repeatable-item--error');
    expect(articles[1]!.textContent).toContain('Missing medication name');
    const removeBtn = articles[1]!.querySelector<HTMLButtonElement>('button')!;
    expect(removeBtn.getAttribute('aria-label')).toBe('Remove Drop 2');
    expect(removeBtn.getAttribute('data-emr-print')).toBe('hide');
    removeBtn.click();
    expect(intents[1]).toEqual({ type: 'repeatItemRemoveRequested', groupId: 'drops', itemId: 'd2' });

    // Hidden null quantity on d1 is omitted; hidden non-null quantity on d2 is shown with span 4
    const d1Fields = [...articles[0]!.querySelectorAll<EmrTypedFieldElement>('emr-typed-field')];
    expect(d1Fields.map((f) => f.controlId)).toEqual(['opd-drops-d1-drug']);
    const d2FieldWrappers = [...articles[1]!.querySelectorAll<HTMLElement>('.repeatable-field')];
    expect(d2FieldWrappers.map((w) => w.style.gridColumn)).toEqual(['span 8', 'span 4']);

    // minItems = 1 blocks removing last remaining item
    group.model = [items[1]!];
    await group.updateComplete;
    expect(group.shadowRoot!.querySelector('article.repeatable-item button')).toBeNull();

    // readOnly omits Add button and maxItems hint
    group.readOnly = true;
    group.model = items;
    await group.updateComplete;
    expect(group.shadowRoot!.querySelector('button')).toBeNull();
    expect(group.shadowRoot!.querySelector('.repeatable-limit')).toBeNull();
  });

  it('renders <emr-clinical-form> with headingId, hyphenated idPrefix, 12-col spans, matrix headers/labels, quantity emptiness, readOnly gating, emptyMessage, and print rules', async () => {
    registerL3Elements();
    const model: ClinicalFormViewModel = {
      schema: {
        id: 'triage',
        label: 'Ophthalmic Triage',
        description: 'Triage intake',
        sections: [{
          id: 'exam',
          label: 'Exam',
          blocks: [
            { id: 'complaint', label: 'Chief complaint', type: 'text', span: 8 },
            { id: 'iop', label: 'IOP', type: 'quantity', unit: 'mmHg', span: 4 },
            { id: 'retained', label: 'Retained IOP', type: 'quantity', unit: 'mmHg', span: 4 },
            {
              kind: 'matrix',
              id: 'eyes',
              label: 'Per eye',
              description: 'Measured bilaterally',
              columns: [{ id: 'od', label: 'OD' }, { id: 'os', label: 'OS' }],
              rows: [{
                id: 'cdr',
                label: 'CD ratio',
                cells: {
                  od: { id: 'cdr-od', label: 'CD OD', type: 'decimal', required: true },
                  os: { id: 'cdr-os', label: 'CD OS', type: 'decimal' },
                },
              }],
            },
            {
              kind: 'repeatable',
              id: 'drops',
              label: 'Drops',
              fields: [{ id: 'drug', label: 'Drug', type: 'text' }],
            },
          ],
        }],
      },
      fields: {
        complaint: { value: 'Halos' },
        iop: { value: { value: null, unit: 'mmHg' }, hidden: true },
        retained: { value: { value: 0, unit: 'mmHg' }, hidden: true },
        'cdr-od': { value: 0.4 },
        'cdr-os': { value: null },
      },
      repeatableGroups: { drops: [{ id: 'd1', fields: { drug: { value: 'Timolol' } } }] },
      correction: { label: 'Request correction', description: 'Record locked' },
      emptyMessage: 'No visible sections.',
    };

    const form = await mount<EmrClinicalFormElement>('emr-clinical-form', {
      model,
      headingId: 'triage-h',
      idPrefix: 'opd-',
    });

    const formEl = form.shadowRoot!.querySelector('form')!;
    expect(formEl.className).toBe('clinical-form');
    expect(formEl.classList.contains('emr-card')).toBe(false);
    expect(formEl.getAttribute('aria-labelledby')).toBe('triage-h');
    expect(formEl.getAttribute('aria-label')).toBeNull();

    const correction = form.shadowRoot!.querySelector('.clinical-form-correction')!;
    expect(correction.getAttribute('data-emr-print')).toBe('hide');

    const sectionCard = form.shadowRoot!.querySelector<EmrSectionCardElement>('emr-section-card')!;
    expect(sectionCard.sectionId).toBe('opd-triage-exam');

    const wrappers = [...form.shadowRoot!.querySelectorAll<HTMLElement>('.clinical-form-field')];
    expect(wrappers.map((w) => w.style.gridColumn)).toEqual(['span 8', 'span 4']);

    const topFields = [...form.shadowRoot!.querySelectorAll<EmrTypedFieldElement>('.clinical-form-field > emr-typed-field')];
    expect(topFields.map((f) => f.controlId)).toEqual(['opd-triage-complaint', 'opd-triage-retained']);

    // Matrix assertions: Clinical field header, description, required *, labelHidden on cell fields
    const matrixWrap = form.shadowRoot!.querySelector('.clinical-form-matrix')!;
    expect(matrixWrap.textContent).toContain('Measured bilaterally');
    expect(matrixWrap.querySelector('thead th')!.textContent).toBe('Clinical field');
    const rowHeader = matrixWrap.querySelector('tbody th[scope="row"]')!;
    expect(rowHeader.textContent).toContain('CD ratio');
    expect(rowHeader.textContent).toContain('*');
    const matrixFields = [...matrixWrap.querySelectorAll<EmrTypedFieldElement>('emr-typed-field')];
    expect(matrixFields.map((f) => f.labelHidden)).toEqual([true, true]);
    expect(matrixFields.map((f) => f.controlId)).toEqual(['opd-triage-cdr-od', 'opd-triage-cdr-os']);

    const group = form.shadowRoot!.querySelector<EmrRepeatableGroupElement>('emr-repeatable-group')!;
    expect(group.idPrefix).toBe('opd-triage');

    // Focus/blur tracking
    let focusCount = 0;
    let blurCount = 0;
    form.addEventListener('focused', () => { focusCount += 1; });
    form.addEventListener('blurred', () => { blurCount += 1; });
    formEl.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(focusCount).toBe(1);
    formEl.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    expect(blurCount).toBe(1);

    // readOnly gates edits while allowing correctionRequested
    const intents = collect(form);
    form.model = { ...model, readOnly: true };
    await form.updateComplete;
    const roFields = [...form.shadowRoot!.querySelectorAll<EmrTypedFieldElement>('.clinical-form-field > emr-typed-field')];
    roFields[0]!.dispatchEvent(new CustomEvent('valueChange', { bubbles: true, composed: true, detail: 'Rejected' }));
    expect(intents).toEqual([]);
    form.shadowRoot!.querySelector<HTMLButtonElement>('.clinical-form-correction-btn')!.click();
    expect(intents).toEqual([{ type: 'correctionRequested' }]);

    // Empty message when all sections are hidden
    form.model = {
      schema: { id: 'e', label: 'E', sections: [{ id: 's', label: 'S', blocks: [{ id: 'iop', label: 'IOP', type: 'quantity', unit: 'mmHg' }] }] },
      fields: { iop: { value: { value: null, unit: 'mmHg' }, hidden: true } },
      repeatableGroups: {},
      emptyMessage: 'No visible sections.',
    };
    await form.updateComplete;
    expect(form.shadowRoot!.querySelector('[role="status"]')!.textContent).toBe('No visible sections.');
  });

  it('renders standalone <emr-clinical-list> with model, headingLevel, headingId, variants, states, capabilities, intents, and focus/blur', async () => {
    registerL3Elements();
    const model: ClinicalListViewModel = {
      title: 'Active ocular problems',
      description: 'Controller-owned diagnoses',
      selectedId: 'p1',
      status: { label: 'Verified', tone: 'success' },
      addLabel: 'Add problem',
      variant: 'elevated',
      items: [
        {
          id: 'p1',
          title: 'Primary open-angle glaucoma',
          subtitle: 'Bilateral (OU)',
          detail: 'On latanoprost',
          meta: 'Updated 2026-04',
          tone: 'info',
          badges: [{ label: 'Active', tone: 'success' }],
        },
        {
          id: 'p2',
          title: 'Pseudophakia (OS)',
          canEdit: false,
        },
        {
          id: 'p3',
          title: 'Historical record',
          readOnly: true,
          selectable: false,
        },
      ],
    };

    const list = await mount<EmrClinicalListElement>('emr-clinical-list', {
      model,
      headingId: 'problems-heading',
      headingLevel: 3,
    });

    const section = list.shadowRoot!.querySelector('section.emr-panel')!;
    expect(section.className).toContain('emr-panel--elevated');
    expect(section.getAttribute('aria-labelledby')).toBe('problems-heading');

    const heading = list.shadowRoot!.querySelector('h3')!;
    expect(heading).not.toBeNull();
    expect(heading.id).toBe('problems-heading');
    expect(heading.textContent).toBe('Active ocular problems');
    expect(list.shadowRoot!.querySelector('.list-description')?.textContent).toBe('Controller-owned diagnoses');
    expect(list.shadowRoot!.querySelector('emr-badge')).not.toBeNull();

    const items = [...list.shadowRoot!.querySelectorAll<HTMLLIElement>('ul.list > li.list-item')];
    expect(items).toHaveLength(3);
    expect(items[0]!.className).toContain('list-item--selected');
    expect(items[0]!.getAttribute('data-tone')).toBe('info');
    expect(items[0]!.querySelector('button.list-select')?.getAttribute('aria-current')).toBe('true');
    expect(items[0]!.querySelector('.list-meta')?.textContent).toBe('Updated 2026-04');

    expect(items[1]!.querySelector('[aria-label="Edit Pseudophakia (OS)"]')).toBeNull();
    expect(items[1]!.querySelector('[aria-label="Remove Pseudophakia (OS)"]')).not.toBeNull();

    expect(items[2]!.className).toContain('list-item--readonly');
    expect(items[2]!.querySelector('button.list-select')).toBeNull();
    expect(items[2]!.querySelector('.list-select--static')).not.toBeNull();
    expect(items[2]!.querySelector('.list-actions')).toBeNull();
    expect(list.shadowRoot!.querySelector('[disabled]')).toBeNull();

    const intents = collect(list);
    list.shadowRoot!.querySelector<HTMLButtonElement>('button.list-add')!.click();
    items[0]!.querySelector<HTMLButtonElement>('button.list-select')!.click();
    items[0]!.querySelector<HTMLButtonElement>('[aria-label="Edit Primary open-angle glaucoma"]')!.click();
    items[0]!.querySelector<HTMLButtonElement>('[aria-label="Remove Primary open-angle glaucoma"]')!.click();
    expect(intents).toEqual([
      { type: 'addRequested' },
      { type: 'selected', id: 'p1' },
      { type: 'editRequested', id: 'p1' },
      { type: 'removeRequested', id: 'p1' },
    ]);

    let focusCount = 0;
    let blurCount = 0;
    list.addEventListener('focused', () => { focusCount += 1; });
    list.addEventListener('blurred', () => { blurCount += 1; });
    section.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(focusCount).toBe(1);
    section.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: items[0]! }));
    expect(blurCount).toBe(0);
    section.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    expect(blurCount).toBe(1);

    // Loading, error (retryRequested), empty, and readOnly
    list.model = { items: [], loading: true, loadingLabel: 'Fetching…' };
    await list.updateComplete;
    let stateMsg = list.shadowRoot!.querySelector('emr-state-message') as HTMLElement & { updateComplete: Promise<boolean>; kind: string; title: string };
    await stateMsg.updateComplete;
    expect(stateMsg.kind).toBe('loading');
    expect(stateMsg.title).toBe('Fetching…');

    list.model = { items: [], error: 'Sync timed out' };
    list.labels = { errorTitle: 'Sync failed', retry: 'Try again' };
    await list.updateComplete;
    stateMsg = list.shadowRoot!.querySelector('emr-state-message') as HTMLElement & { updateComplete: Promise<boolean>; kind: string; title: string };
    await stateMsg.updateComplete;
    expect(stateMsg.kind).toBe('error');
    stateMsg.shadowRoot!.querySelector<HTMLButtonElement>('button.emr-state-message__action')!.click();
    expect(intents[intents.length - 1]).toEqual({ type: 'retryRequested' });

    list.model = { items: [], emptyTitle: 'None recorded', emptyMessage: 'Not assessed yet.' };
    await list.updateComplete;
    stateMsg = list.shadowRoot!.querySelector('emr-state-message') as HTMLElement & { updateComplete: Promise<boolean>; kind: string; title: string };
    await stateMsg.updateComplete;
    expect(stateMsg.kind).toBe('empty');
    expect(stateMsg.title).toBe('None recorded');

    list.model = { ...model, readOnly: true };
    await list.updateComplete;
    expect(section.className).toContain('emr-panel--readonly');
    expect(list.shadowRoot!.querySelector('button.list-add')).toBeNull();
    expect(list.shadowRoot!.querySelector('.list-actions')).toBeNull();
  });

  it('renders all four L4 clinical list wrappers with default titles, headingIds, and model/intent forwarding', async () => {
    registerL4Elements();
    const cases = [
      { tag: 'emr-medication-list', headingId: 'emr-medication-list-title', title: 'Medications' },
      { tag: 'emr-allergy-list', headingId: 'emr-allergy-list-title', title: 'Allergies' },
      { tag: 'emr-chronic-disease-list', headingId: 'emr-chronic-list-title', title: 'Chronic diseases' },
      { tag: 'emr-personal-history-list', headingId: 'emr-history-list-title', title: 'Significant personal history' },
    ] as const;

    for (const c of cases) {
      const el = await mount<EmrClinicalListElement>(c.tag, {
        model: { items: [{ id: 'item-1', title: 'Synthetic item' }] },
        headingLevel: 4,
      });
      const section = el.shadowRoot!.querySelector('section.emr-panel')!;
      expect(section.getAttribute('aria-labelledby')).toBe(c.headingId);
      const heading = el.shadowRoot!.querySelector('h4')!;
      expect(heading.id).toBe(c.headingId);
      expect(heading.textContent).toBe(c.title);

      const intents = collect(el);
      el.shadowRoot!.querySelector<HTMLButtonElement>('button.list-select')!.click();
      expect(intents).toEqual([{ type: 'selected', id: 'item-1' }]);
    }
  });

  it('renders <emr-clinical-matrix> with columnGroups, h2, Clinical field, N/A sr-only, metadata, presets, remark alert, cards, focus/blur, and zero disabled', async () => {
    registerL3Elements();
    const definition: ClinicalMatrixSchema = {
      id: 'anterior',
      label: 'Anterior Segment Matrix',
      description: 'Slit-lamp assessment',
      columnGroups: [{ id: 'eyes', label: 'Laterality', columnIds: ['od', 'os'] }],
      columns: [
        { id: 'od', label: 'Right Eye (OD)' },
        { id: 'os', label: 'Left Eye (OS)' },
      ],
      rows: [
        {
          id: 'iop',
          label: 'IOP',
          type: 'quantity',
          unit: 'mmHg',
          helpText: 'Goldmann applanation',
          required: true,
          assessmentStatusOptions: [
            { value: 'recorded', label: 'Recorded', tone: 'success' },
            { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
          ],
        },
        {
          id: 'gonio',
          label: 'Gonioscopy',
          type: 'custom',
          customRendererKey: 'angleStamp',
          applicableColumnIds: ['od'],
        },
      ],
    };
    const model: ClinicalMatrixValues = {
      iop: {
        remark: 'GAT 09:45',
        remarkError: 'Check calibration',
        remarkDisabled: true,
        cells: {
          od: {
            value: { value: 22, unit: 'mmHg' },
            modified: true,
            previousValueLabel: 'Prev: 18 mmHg',
            deltaLabel: '+4',
            flagBadge: { label: 'High', tone: 'danger' },
            quickPresets: ['16', '20'],
            assessmentStatus: { value: 'recorded', label: 'Recorded', tone: 'success' },
          },
          os: {
            value: { value: 16, unit: 'mmHg' },
            disabled: true,
          },
        },
      },
      gonio: {
        remark: '',
        cells: { od: { value: 1 } },
      },
    };

    const matrix = await mount<EmrClinicalMatrixElement>('emr-clinical-matrix', {
      definition,
      model,
      idPrefix: 'opd',
      headingId: 'matrix-h',
      customRenderers: {
        angleStamp: (ctx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = `Stamp ${ctx.column.id} (${String(ctx.cell?.value ?? 0)})`;
          btn.onclick = () => ctx.emit('stamp', { columnId: ctx.column.id });
          return btn;
        },
      },
    });

    const section = matrix.shadowRoot!.querySelector('section.emr-matrix')!;
    expect(section.getAttribute('aria-labelledby')).toBe('matrix-h');
    const heading = matrix.shadowRoot!.querySelector('h2')!;
    expect(heading.id).toBe('matrix-h');
    expect(heading.textContent).toBe('Anterior Segment Matrix');
    expect(matrix.shadowRoot!.querySelector('.emr-matrix__description')?.textContent).toBe('Slit-lamp assessment');

    const headers = [...matrix.shadowRoot!.querySelectorAll('thead th')].map((el) => el.textContent?.trim());
    expect(headers).toContain('Clinical field');
    expect(headers).toContain('Laterality');
    expect(headers).toContain('Remarks');
    expect(headers).not.toContain('Finding');
    expect(matrix.shadowRoot!.querySelector('thead th[scope="colgroup"]')?.getAttribute('colspan')).toBe('2');

    const rowHeader = matrix.shadowRoot!.querySelector('tbody th[scope="row"]')!;
    expect(rowHeader.textContent).toContain('IOP');
    expect(rowHeader.textContent).toContain('(mmHg)');
    expect(rowHeader.textContent).toContain('Goldmann applanation');

    // Non-applicable cell renders — + sr-only Not applicable
    const na = matrix.shadowRoot!.querySelector('.emr-matrix__na')!;
    expect(na.textContent).toContain('—');
    expect(na.querySelector('.emr-sr-only')?.textContent).toBe('Not applicable');

    // Metadata & presets & remark alert & cards
    expect(matrix.shadowRoot!.textContent).toContain('Prev: 18 mmHg');
    expect(matrix.shadowRoot!.textContent).toContain('+4');
    expect(matrix.shadowRoot!.querySelector('.emr-matrix__cell--modified')).not.toBeNull();
    expect(matrix.shadowRoot!.querySelectorAll('.emr-matrix-card')).toHaveLength(2);
    expect(matrix.shadowRoot!.querySelector('[role="alert"]')?.textContent).toBe('Check calibration');
    expect(matrix.shadowRoot!.querySelectorAll('[disabled]')).toHaveLength(0);

    const intents = collect(matrix);
    const presetBtn = matrix.shadowRoot!.querySelector<HTMLButtonElement>('button.emr-matrix__preset')!;
    presetBtn.click();
    expect(intents[0]).toEqual({
      type: 'cellEditRequested',
      rowId: 'iop',
      columnId: 'od',
      value: { value: 16, unit: 'mmHg' },
    });

    // Custom cell renderer inside matrix emits customCellIntent
    const customHost = matrix.shadowRoot!.querySelector<EmrClinicalCellRendererElement>('emr-clinical-cell-renderer')!;
    await customHost.updateComplete;
    customHost.shadowRoot!.querySelector<HTMLButtonElement>('button')!.click();
    expect(intents[1]).toEqual({
      type: 'customCellIntent',
      rowId: 'gonio',
      columnId: 'od',
      action: 'stamp',
      payload: { columnId: 'od' },
    });

    // Assessment status select clears back to null
    const statusSelect = matrix.shadowRoot!.querySelector<HTMLSelectElement>('select[aria-label^="Assessment status"]')!;
    statusSelect.value = '';
    statusSelect.dispatchEvent(new Event('change'));
    expect(intents[2]).toEqual({
      type: 'cellAssessmentStatusEditRequested',
      rowId: 'iop',
      columnId: 'od',
      status: null,
    });

    // Focus/blur tracking
    let focusCount = 0;
    let blurCount = 0;
    matrix.addEventListener('focused', () => { focusCount += 1; });
    matrix.addEventListener('blurred', () => { blurCount += 1; });
    section.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(focusCount).toBe(1);
    section.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    expect(blurCount).toBe(1);
  });

  it('gates standalone <emr-clinical-cell-renderer> emit when readOnly', async () => {
    registerL3Elements();
    const emitted: string[] = [];
    const el = await mount<EmrClinicalCellRendererElement>('emr-clinical-cell-renderer', {
      columnId: 'od',
      cellModel: {
        row: { id: 'gonio', label: 'Gonioscopy', type: 'custom' },
        column: { id: 'od', label: 'OD' },
        cell: { value: 1 },
        readOnly: true,
        emit: (action) => emitted.push(action),
      },
      renderer: (ctx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-readonly', ctx.readOnly ? 'true' : 'false');
        btn.textContent = 'Stamp';
        btn.onclick = () => ctx.emit('stamp');
        return btn;
      },
    });
    const btn = el.shadowRoot!.querySelector<HTMLButtonElement>('button')!;
    expect(btn.getAttribute('aria-readonly')).toBe('true');
    btn.click();
    expect(emitted).toEqual([]);
  });

  it('renders <emr-annotation-toolbar> with monochrome SVGs, Pen popover, Escape/outside-click close, roving tabindex, zero disabled, guards, and focus/blur', async () => {
    registerL3Elements();
    const model: AnnotationToolbarViewModel = {
      tools: [
        { id: 'select', label: 'Select', icon: 'heroCursorArrowRays', shortcutLabel: 'V' },
        { id: 'line', label: 'Line', icon: 'shape-line', shortcutLabel: 'L' },
        { id: 'lockedTool', label: 'Locked', icon: 'shape-rect', disabled: true },
      ],
      selectedToolId: 'line',
      colours: [
        { id: 'red', label: 'Red', hex: '#d92d20' },
        { id: 'blue', label: 'Blue', hex: '#1d4ed8' },
      ],
      selectedColourId: 'red',
      widths: [
        { id: 'w1', label: 'Thin 1px', px: 1 },
        { id: 'w2', label: 'Medium 3px', px: 3 },
      ],
      selectedWidthId: 'w2',
      canUndo: true,
      canRedo: false,
      zoomLabel: '100%',
      canSave: true,
      saveLabel: 'Save sketch',
    };

    const tb = await mount<EmrAnnotationToolbarElement>('emr-annotation-toolbar', {
      model,
      idPrefix: 'opd',
      headingId: 'tb-h',
      labels: { undo: 'Revert step' },
    });

    expect(tb.shadowRoot!.querySelector('[disabled]')).toBeNull();
    expect(tb.shadowRoot!.querySelector('.tbw')?.getAttribute('data-emr-print')).toBe('hide');
    expect(tb.shadowRoot!.querySelector('[role="toolbar"]')?.getAttribute('aria-labelledby')).toBe('tb-h');
    expect(tb.shadowRoot!.querySelectorAll('svg').length).toBeGreaterThan(0);

    const penBtn = tb.shadowRoot!.querySelector<HTMLButtonElement>('button[data-key="pen"]')!;
    expect(penBtn.getAttribute('aria-controls')).toBe('opd-emr-tb-pen-panel');
    expect(penBtn.getAttribute('aria-expanded')).toBe('false');

    const intents = collect(tb);
    // Disabled tool and !canRedo are aria-disabled and guarded
    const lockedBtn = tb.shadowRoot!.querySelector<HTMLButtonElement>('button[data-key="t:lockedTool"]')!;
    expect(lockedBtn.getAttribute('aria-disabled')).toBe('true');
    lockedBtn.click();
    const redoBtn = tb.shadowRoot!.querySelector<HTMLButtonElement>('button[data-key="redo"]')!;
    expect(redoBtn.getAttribute('aria-disabled')).toBe('true');
    redoBtn.click();
    expect(intents).toEqual([]);

    // Valid tool & undo
    tb.shadowRoot!.querySelector<HTMLButtonElement>('button[data-key="t:select"]')!.click();
    tb.shadowRoot!.querySelector<HTMLButtonElement>('button[aria-label="Revert step"]')!.click();
    expect(intents).toEqual([
      { type: 'toolSelected', toolId: 'select' },
      { type: 'undoRequested' },
    ]);

    // Pen opens, picks colour, closes & refocuses
    penBtn.click();
    await tb.updateComplete;
    expect(penBtn.getAttribute('aria-expanded')).toBe('true');
    expect(tb.shadowRoot!.querySelector('#opd-emr-tb-pen-panel')).not.toBeNull();
    tb.shadowRoot!.querySelector<HTMLButtonElement>('#opd-emr-tb-pen-panel button[aria-label="Blue"]')!.click();
    await tb.updateComplete;
    expect(tb.shadowRoot!.querySelector('#opd-emr-tb-pen-panel')).toBeNull();
    expect(intents[intents.length - 1]).toEqual({ type: 'colourSelected', colourId: 'blue' });

    // Pen Escape & outside-click close
    penBtn.click();
    await tb.updateComplete;
    tb.shadowRoot!.querySelector('.tbw')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await tb.updateComplete;
    expect(tb.shadowRoot!.querySelector('#opd-emr-tb-pen-panel')).toBeNull();

    penBtn.click();
    await tb.updateComplete;
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    await tb.updateComplete;
    expect(tb.shadowRoot!.querySelector('#opd-emr-tb-pen-panel')).toBeNull();

    // readOnly + zoomLocked guards
    tb.model = { ...model, readOnly: true, zoomLocked: true };
    await tb.updateComplete;
    tb.shadowRoot!.querySelector<HTMLButtonElement>('button[data-key="t:select"]')!.click();
    tb.shadowRoot!.querySelector<HTMLButtonElement>('button[data-key="zoomIn"]')!.click();
    tb.shadowRoot!.querySelector<HTMLButtonElement>('button[data-key="save"]')!.click();
    expect(intents).toHaveLength(3);

    // focus / blur (reset focus state first since Escape refocused penBtn)
    const tbw = tb.shadowRoot!.querySelector('.tbw')!;
    tbw.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    let focusCount = 0;
    let blurCount = 0;
    tb.addEventListener('focused', () => { focusCount += 1; });
    tb.addEventListener('blurred', () => { blurCount += 1; });
    tbw.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(focusCount).toBe(1);
    tbw.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    expect(blurCount).toBe(1);
  });

  it('renders <emr-annotation-list> without hardcoded heading, with monochrome SVGs, aria-current, locked guards, readOnly legend, and focus/blur', async () => {
    registerL3Elements();
    const model: AnnotationListViewModel = {
      items: [
        {
          layer: {
            id: 'l1',
            label: 'RNFL defect',
            color: '#d92d20',
            strokeWidth: 3,
            visible: true,
            tool: 'circle',
            center: { x: 0.4, y: 0.5 },
            radiusX: 0.1,
            radiusY: 0.1,
          },
          number: 1,
          classLabel: 'Lesion',
          locked: true,
        },
        {
          layer: {
            id: 'l2',
            label: 'Haemorrhage',
            color: '#1d4ed8',
            strokeWidth: 3,
            visible: false,
            tool: 'line',
            points: [
              { x: 0.2, y: 0.2 },
              { x: 0.3, y: 0.3 },
            ],
          },
          number: 2,
          description: '7 o’clock disc margin',
        },
      ],
      selectedLayerId: 'l2',
      emptyMessage: 'No layers yet.',
      canLock: true,
    };

    const list = await mount<EmrAnnotationListElement>('emr-annotation-list', {
      model,
      idPrefix: 'eye',
      headingId: 'marks-h',
    });

    expect(list.shadowRoot!.querySelector('h4')).toBeNull();
    expect(list.shadowRoot!.querySelector('[disabled]')).toBeNull();
    expect(list.shadowRoot!.querySelector('ol.al')?.id).toBe('eye-emr-annotation-list');
    expect(list.shadowRoot!.querySelector('ol.al')?.getAttribute('aria-labelledby')).toBe('marks-h');
    expect(list.shadowRoot!.querySelector('li[data-id="l2"]')?.getAttribute('aria-current')).toBe('true');
    expect(list.shadowRoot!.querySelector('.al__acts')?.getAttribute('data-emr-print')).toBe('hide');
    expect(list.shadowRoot!.querySelectorAll('svg').length).toBeGreaterThan(0);

    const intents = collect(list);
    // Locked l1 delete is aria-disabled and guarded
    const delL1 = list.shadowRoot!.querySelector<HTMLButtonElement>('button[aria-label="Delete drawing 1, Lesion"]')!;
    expect(delL1.getAttribute('aria-disabled')).toBe('true');
    delL1.click();
    expect(intents).toEqual([]);

    // Selected l2: move down disabled, move up allowed
    const downL2 = list.shadowRoot!.querySelector<HTMLButtonElement>('button[aria-label="Move drawing 2 down, Haemorrhage"]')!;
    expect(downL2.getAttribute('aria-disabled')).toBe('true');
    downL2.click();
    const upL2 = list.shadowRoot!.querySelector<HTMLButtonElement>('button[aria-label="Move drawing 2 up, Haemorrhage"]')!;
    upL2.click();
    expect(intents).toEqual([{ type: 'layerMoveRequested', layerId: 'l2', direction: 'up' }]);

    // readOnly legend hides actions and keeps selection active
    list.model = { ...model, readOnly: true };
    await list.updateComplete;
    expect(list.shadowRoot!.querySelector('.al__acts')).toBeNull();
    list.shadowRoot!.querySelector<HTMLButtonElement>('li[data-id="l1"] button.al__main')!.click();
    expect(intents[1]).toEqual({ type: 'layerSelected', layerId: 'l1' });

    // empty message
    list.model = { ...model, items: [] };
    await list.updateComplete;
    expect(list.shadowRoot!.querySelector('[role="status"]')?.textContent).toBe('No layers yet.');

    // focus / blur
    let focusCount = 0;
    let blurCount = 0;
    list.addEventListener('focused', () => { focusCount += 1; });
    list.addEventListener('blurred', () => { blurCount += 1; });
    const status = list.shadowRoot!.querySelector('[role="status"]')!;
    status.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(focusCount).toBe(1);
    status.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    expect(blurCount).toBe(1);
  });

  it('renders <emr-image-template-picker> with monochrome SVGs, Favourites + All sections, readOnly guards, Escape handling, print hide, and focus/blur', async () => {
    registerL3Elements();
    const model: ImageTemplatePickerViewModel = {
      title: 'Choose an outline',
      options: [
        { id: 'r-od', label: 'Retina OD', imageUrl: '/r-od.svg', width: 120, height: 120, groupId: 'retina', badges: ['Right'] },
        { id: 'r-os', label: 'Retina OS', imageUrl: '/r-os.svg', width: 120, height: 120, groupId: 'retina', badges: ['Left'] },
        { id: 'c-od', label: 'Cornea OD', imageUrl: '/c-od.svg', width: 120, height: 120, groupId: 'cornea', badges: ['Right'] },
      ],
      groups: [
        { id: 'retina', label: 'Retina', count: 2 },
        { id: 'cornea', label: 'Cornea', count: 1 },
      ],
      query: 'right',
      selectedId: 'r-od',
      totalLabel: '3 of 3 outlines',
      emptyMessage: 'No outlines match.',
      favouriteIds: ['c-od'],
      canEditFavourites: true,
    };

    const picker = await mount<EmrImageTemplatePickerElement>('emr-image-template-picker', {
      model,
      idPrefix: 'opd',
      headingId: 'tpl-head',
      labels: { clearSearch: 'Reset query' },
    });

    const sr = picker.shadowRoot!;
    expect(sr.querySelector('[disabled]')).toBeNull();
    expect(sr.textContent).not.toMatch(/[★☆✕✓]/);
    expect(sr.querySelector('section.tp')?.id).toBe('opd-emr-image-template-picker');
    expect(sr.querySelector('section.tp')?.getAttribute('aria-labelledby')).toBe('tpl-head');
    expect(sr.querySelector('section.tp')?.getAttribute('data-emr-print')).toBe('hide');
    expect(sr.querySelectorAll('svg').length).toBeGreaterThan(0);
    expect(sr.querySelectorAll('.tp__sec')).toHaveLength(2);

    const intents = collect(picker);

    // Clear search button emits queryChangeRequested: ''
    sr.querySelector<HTMLButtonElement>('button[aria-label="Reset query"]')!.click();
    expect(intents[0]).toEqual({ type: 'queryChangeRequested', query: '' });

    // Escape clears active search; when query is empty it emits closeRequested
    const section = sr.querySelector('section.tp')!;
    section.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(intents[1]).toEqual({ type: 'queryChangeRequested', query: '' });

    picker.model = { ...model, query: '' };
    await picker.updateComplete;
    section.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(intents[2]).toEqual({ type: 'closeRequested' });

    // Tile selection and favourite toggle emit
    sr.querySelector<HTMLButtonElement>('button[aria-label="Retina OS, Left"]')!.click();
    sr.querySelector<HTMLButtonElement>('button[aria-label="Add Retina OS to favourites"]')!.click();
    expect(intents.slice(3)).toEqual([
      { type: 'templateSelected', templateId: 'r-os' },
      { type: 'favouriteToggleRequested', templateId: 'r-os', favourite: true },
    ]);

    // readOnly marks tiles aria-disabled, hides stars, blocks selection, keeps search & chips operable
    const countBeforeReadOnly = intents.length;
    picker.readOnly = true;
    await picker.updateComplete;
    const roTile = sr.querySelector<HTMLButtonElement>('button[aria-label="Retina OS, Left"]')!;
    expect(roTile.getAttribute('aria-disabled')).toBe('true');
    expect(sr.querySelector('.tp__star')).toBeNull();
    roTile.click();
    expect(intents).toHaveLength(countBeforeReadOnly);

    const retinaChip = [...sr.querySelectorAll<HTMLButtonElement>('.tp__chip')].find((b) =>
      b.textContent?.includes('Retina'),
    )!;
    retinaChip.click();
    expect(intents[countBeforeReadOnly]).toEqual({ type: 'groupSelected', groupId: 'retina' });

    // Empty state recovery: Clear search, Show all, Reset filters
    picker.readOnly = false;
    picker.model = { ...model, options: [], query: 'zzz', selectedGroupId: 'retina' };
    await picker.updateComplete;
    const resetBtn = [...sr.querySelectorAll<HTMLButtonElement>('.tp__empty-btn')].find((b) =>
      b.textContent?.includes('Reset filters'),
    )!;
    resetBtn.click();
    expect(intents.slice(countBeforeReadOnly + 1)).toEqual([
      { type: 'queryChangeRequested', query: '' },
      { type: 'groupSelected', groupId: null },
    ]);

    // focus / blur
    let focusCount = 0;
    let blurCount = 0;
    picker.addEventListener('focused', () => { focusCount += 1; });
    picker.addEventListener('blurred', () => { blurCount += 1; });
    const closeBtn = sr.querySelector<HTMLButtonElement>('.tp__close')!;
    closeBtn.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(focusCount).toBe(1);
    closeBtn.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    expect(blurCount).toBe(1);
  });
});

it('proposes a theme configuration without changing the supplied config or document root', async () => {
  registerL6Elements();
  const theme = await mount<EmrThemeCustomizerElement>('emr-theme-customizer', {});
  const intents = collect(theme);
  const original = theme.config;
  const styles = document.documentElement.style.cssText;
  const changes: unknown[] = [];
  theme.addEventListener('valueChange', (event) => changes.push(event));
  const option = theme.shadowRoot!.querySelector<HTMLButtonElement>('button[aria-pressed="false"]')!;
  option.click();
  expect(intents).toHaveLength(1);
  expect(intents[0]).toMatchObject({ type: 'themeConfigChanged' });
  expect(changes).toEqual([]);
  expect(theme.config).toBe(original);
  expect(document.documentElement.style.cssText).toBe(styles);
});
