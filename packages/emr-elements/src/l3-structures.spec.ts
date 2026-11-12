// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { ClinicalFormViewModel, EmrDataTableModel } from '@drguptavivek/emr-controller';
import { registerL6Elements, type EmrThemeCustomizerElement } from './l6-authoring.js';
import {
  registerL3Elements,
  type EmrClinicalFormElement,
  type EmrClinicalMatrixElement,
  type EmrDataTableElement,
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

  it('renders a read-only time axis without state-changing controls', async () => {
    registerL3Elements();
    const axis = await mount<EmrTimeAxisElement>('emr-time-axis', {
      model: { id: 'axis', ticks: [{ id: 'morning', label: '08:00' }], canShiftLater: true, readOnly: true },
    });
    expect(axis.shadowRoot!.textContent).toContain('08:00');
    expect(axis.shadowRoot!.querySelector('button')).toBeNull();
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
