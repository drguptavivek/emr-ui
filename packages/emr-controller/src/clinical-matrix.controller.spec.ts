import { describe, expect, it } from 'vitest';
import {
  ClinicalMatrixController,
  canMutateMatrixCell,
  canMutateMatrixRemark,
  formatMatrixCellValue,
  groupMatrixColumns,
  isMatrixCellApplicable,
  resolveMatrixDecimalStep,
  resolveMatrixHeadingId,
  resolveMatrixQuantityUnit,
} from './clinical-matrix.controller.js';
import type { ClinicalMatrixSchema, ClinicalMatrixValues } from './models.js';

describe('clinical-matrix helpers & controller', () => {
  it('groups columns into contiguous runs preserving ungrouped columns and split groups', () => {
    const columns = [
      { id: 'od', label: 'OD' },
      { id: 'os', label: 'OS' },
      { id: 'ou', label: 'OU' },
      { id: 'od-pinhole', label: 'OD Pinhole' },
    ];
    const slots = groupMatrixColumns(columns, [
      { id: 'eyes', label: 'Laterality', columnIds: ['od', 'os', 'od-pinhole'] },
    ]);
    expect(slots).toEqual([
      {
        kind: 'group',
        id: 'eyes',
        label: 'Laterality',
        columns: [columns[0], columns[1]],
        colSpan: 2,
      },
      {
        kind: 'ungrouped',
        columns: [columns[2]],
        colSpan: 1,
      },
      {
        kind: 'group',
        id: 'eyes',
        label: 'Laterality',
        columns: [columns[3]],
        colSpan: 1,
      },
    ]);
  });

  it('resolves applicability, formatting, heading ids, steps, units, and mutation gates', () => {
    expect(isMatrixCellApplicable({}, 'od')).toBe(true);
    expect(isMatrixCellApplicable({ applicableColumnIds: ['od'] }, 'os')).toBe(false);

    expect(formatMatrixCellValue(true)).toBe('Yes');
    expect(formatMatrixCellValue(false)).toBe('No');
    expect(formatMatrixCellValue(null)).toBe('Not recorded');
    expect(formatMatrixCellValue({ value: 18, unit: 'mmHg' })).toBe('18 mmHg');

    expect(resolveMatrixHeadingId('iop', undefined, 'opd')).toBe('opd-iop-title');
    expect(resolveMatrixHeadingId('iop', 'custom-h', 'opd')).toBe('custom-h');

    expect(resolveMatrixDecimalStep({ type: 'integer' })).toBe(1);
    expect(resolveMatrixDecimalStep({ type: 'decimal', precision: 2 })).toBe(0.01);
    expect(resolveMatrixDecimalStep({ type: 'decimal', precision: 2, step: 0.25 })).toBe(0.25);

    expect(resolveMatrixQuantityUnit({ unit: 'mmHg' }, { value: { value: 16, unit: 'kPa' } })).toBe('kPa');
    expect(resolveMatrixQuantityUnit({ unit: 'mmHg' })).toBe('mmHg');

    expect(canMutateMatrixCell(false, { readOnly: false })).toBe(true);
    expect(canMutateMatrixCell(true, {})).toBe(false);
    expect(canMutateMatrixCell(false, { disabled: true })).toBe(false);
    expect(canMutateMatrixRemark(false, { remarkReadOnly: true })).toBe(false);
    expect(canMutateMatrixRemark(false, { remarkDisabled: true })).toBe(false);
  });

  it('validates remarks and re-evaluates cell validation on columnCopyRequested and cellAssessmentStatusEditRequested', () => {
    const schema: ClinicalMatrixSchema = {
      id: 'iop',
      label: 'IOP',
      description: 'Goldmann applanation',
      showRemarks: true,
      columns: [
        { id: 'od', label: 'Right (OD)' },
        { id: 'os', label: 'Left (OS)' },
      ],
      rows: [
        {
          id: 'pressure',
          label: 'IOP',
          type: 'integer',
          min: 0,
          max: 60,
          assessmentStatusOptions: [
            { value: 'recorded', label: 'Recorded', tone: 'success' },
            { value: 'unable-to-assess', label: 'Unable to assess', tone: 'warning' },
          ],
        },
      ],
    };
    const values: ClinicalMatrixValues = {
      pressure: {
        remark: '',
        cells: {
          od: { value: 65, error: 'Too high' },
          os: { value: 16 },
        },
      },
    };
    const controller = new ClinicalMatrixController(
      schema,
      values,
      (state, rowId, columnId) => {
        const cell = state.values[rowId]?.cells[columnId];
        if (!cell) return undefined;
        if (cell.assessmentStatus?.value === 'unable-to-assess') return undefined;
        if (typeof cell.value === 'number' && cell.value > 60) return 'Above physiological range';
        return undefined;
      },
      (state, rowId) => {
        const remark = state.values[rowId]?.remark ?? '';
        return remark.length > 20 ? 'Remark too long' : undefined;
      }
    );

    controller.dispatch({ type: 'remarkEditRequested', rowId: 'pressure', remark: 'x'.repeat(25) });
    expect(controller.getSnapshot().values.pressure.remarkError).toBe('Remark too long');

    controller.dispatch({
      type: 'cellAssessmentStatusEditRequested',
      rowId: 'pressure',
      columnId: 'od',
      status: 'unable-to-assess',
    });
    expect(controller.getSnapshot().values.pressure.cells.od.error).toBeUndefined();

    controller.dispatch({ type: 'columnCopyRequested', fromColumnId: 'od', toColumnId: 'os' });
    expect(controller.getSnapshot().values.pressure.cells.os.value).toBe(65);
    expect(controller.getSnapshot().values.pressure.cells.os.modified).toBe(true);
    expect(controller.getSnapshot().values.pressure.cells.os.error).toBe('Above physiological range');
  });
});
