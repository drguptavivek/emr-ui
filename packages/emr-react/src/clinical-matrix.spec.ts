// @vitest-environment jsdom
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => import('react-native-web'));

import type { ClinicalMatrixIntent, ClinicalMatrixSchema, ClinicalMatrixValues } from '@drguptavivek/emr-controller';
import { EmrClinicalCellRenderer, EmrClinicalMatrix, type EmrMatrixCellRendererProps } from './l3-structures';
import { isMatrixStacked } from './l3-structures.logic';

describe('EmrClinicalMatrix & EmrClinicalCellRenderer (React)', () => {
  const schema: ClinicalMatrixSchema = {
    id: 'anterior',
    label: 'Anterior Segment Matrix',
    description: 'Slit-lamp exam grid',
    showRemarks: true,
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
        min: 0,
        max: 80,
        step: 1,
        required: true,
        assessmentStatusOptions: [
          { value: 'recorded', label: 'Recorded', tone: 'success' },
          { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
        ],
      },
      {
        id: 'gonioscopy',
        label: 'Gonioscopy',
        type: 'custom',
        customRendererKey: 'angleStamp',
        applicableColumnIds: ['od'],
      },
      {
        id: 'cornea',
        label: 'Cornea',
        type: 'text',
        maxLength: 120,
        placeholder: 'Findings',
      },
    ],
  };

  const model: ClinicalMatrixValues = {
    iop: {
      remark: 'GAT',
      remarkError: 'Verify calibration',
      cells: {
        od: {
          value: { value: 24, unit: 'mmHg' },
          warning: 'Above 21 mmHg',
          error: 'Recheck',
          modified: true,
          previousValueLabel: 'Prev: 18 mmHg',
          deltaLabel: '+6',
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
    gonioscopy: {
      remark: '',
      cells: {
        od: { value: 2 },
      },
    },
    cornea: {
      remark: 'Locked remark',
      remarkDisabled: true,
      cells: {
        od: { value: 'Clear' },
        os: { value: 'Clear' },
      },
    },
  };

  it('renders headingId, description, metadata, N/A cell, aria-describedby, and zero disabled attributes', () => {
    const CustomStamp = ({ row, column, cell, readOnly, emit }: EmrMatrixCellRendererProps) =>
      createElement(
        'button',
        {
          type: 'button',
          'aria-readonly': readOnly ? 'true' : undefined,
          onClick: () => emit('stamp', { columnId: column.id, rowId: row.id }),
        },
        `Stamp ${column.id} (${String(cell?.value ?? 0)})`,
      );

    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    act(() => {
      root.render(
        createElement(EmrClinicalMatrix, {
          definition: schema,
          model,
          headingId: 'custom-matrix-heading',
          idPrefix: 'opd',
          customRenderers: { angleStamp: CustomStamp },
          onIntent: () => {},
        }),
      );
    });
    const html = host.innerHTML;

    expect(html).toContain('aria-labelledby="custom-matrix-heading"');
    expect(html).toContain('id="custom-matrix-heading"');
    expect(html).toContain('Slit-lamp exam grid');
    expect(html).toContain('Laterality');
    expect(html).toContain('Prev: 18 mmHg');
    expect(html).toContain('+6');
    expect(html).toContain('High');
    expect(html).toContain('Modified');
    expect(html).toContain('Warning: Above 21 mmHg');
    expect(html).toContain('Recheck');
    expect(html).toContain('Verify calibration');
    expect(html).toContain('aria-label="Not applicable"');
    expect(html).toContain('Stamp od (2)');
    expect(html).toContain('aria-describedby="opd-anterior-iop-od-warning opd-anterior-iop-od-error"');
    expect(html).toContain('aria-describedby="opd-anterior-iop-remark-error"');
    expect(html).not.toMatch(/\sdisabled(?:=|>|\s)/);

    act(() => {
      root.unmount();
    });
    host.remove();
  });

  it('uses windowWidth fallback for initial-paint stacking on <720px viewports', () => {
    expect(isMatrixStacked(0, 390)).toBe(true);
    expect(isMatrixStacked(0, 1024)).toBe(false);
    expect(isMatrixStacked(0, 0)).toBe(false);
    expect(isMatrixStacked(420, 1280)).toBe(true);
  });

  it('gates custom cell emit when readOnly or cell.disabled and handles clearable/preset/focus intents', () => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    const intents: ClinicalMatrixIntent[] = [];
    let focusCount = 0;
    let blurCount = 0;

    const CustomStamp = ({ column, cell, readOnly, emit }: EmrMatrixCellRendererProps) =>
      createElement(
        'button',
        {
          type: 'button',
          'data-testid': `stamp-${column.id}`,
          'aria-readonly': readOnly ? 'true' : undefined,
          onClick: () => emit('stamp', { next: Number(cell?.value ?? 0) + 1 }),
        },
        `Stamp ${column.id}`,
      );

    act(() => {
      root.render(
        createElement(EmrClinicalMatrix, {
          definition: schema,
          model,
          readOnly: false,
          customRenderers: { angleStamp: CustomStamp },
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

    const presetBtn = host.querySelector<HTMLElement>('[aria-label="Set IOP, Right Eye (OD) to 16"]')!;
    act(() => {
      presetBtn.click();
    });
    expect(intents[0]).toEqual({
      type: 'cellEditRequested',
      rowId: 'iop',
      columnId: 'od',
      value: { value: 16, unit: 'mmHg' },
    });

    const stampBtn = host.querySelector<HTMLElement>('[data-testid="stamp-od"]')!;
    act(() => {
      stampBtn.click();
    });
    expect(intents[1]).toEqual({
      type: 'customCellIntent',
      rowId: 'gonioscopy',
      columnId: 'od',
      action: 'stamp',
      payload: { next: 3 },
    });

    // Standalone EmrClinicalCellRenderer blocks emit when readOnly=true
    const cellHost = document.createElement('div');
    document.body.append(cellHost);
    const cellRoot = createRoot(cellHost);
    const directEmits: string[] = [];
    act(() => {
      cellRoot.render(
        createElement(EmrClinicalCellRenderer, {
          row: schema.rows[1],
          column: schema.columns[0],
          cell: { value: 2 },
          readOnly: true,
          renderer: CustomStamp,
          emit: (action) => directEmits.push(action),
        }),
      );
    });
    const directBtn = cellHost.querySelector<HTMLElement>('[data-testid="stamp-od"]')!;
    expect(directBtn.getAttribute('aria-readonly')).toBe('true');
    act(() => {
      directBtn.click();
    });
    expect(directEmits).toEqual([]);

    const region = host.querySelector<HTMLElement>('[role="region"]')!;
    act(() => {
      region.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });
    expect(focusCount).toBe(1);
    act(() => {
      region.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
    });
    expect(blurCount).toBe(1);

    act(() => {
      root.unmount();
      cellRoot.unmount();
    });
    host.remove();
    cellHost.remove();
  });
});
