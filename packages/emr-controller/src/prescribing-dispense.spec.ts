import { describe, expect, it } from 'vitest';
import type { PrescribingRow } from './dose-schedule.models.js';
import { calculateFixedScheduleDispenseQuantity } from './prescribing-dispense.js';

const row: PrescribingRow = {
  id: 'rx-1',
  drugName: 'Fixture medication',
  strength: '100 mg',
  form: 'tablet',
  formLabel: 'Tablet',
  route: 'oral',
  unitLabel: 'tab',
  frequencyCode: 'BD',
  slots: [
    { id: 'm', label: 'Morning', amount: 1 },
    { id: 'n', label: 'Night', amount: 0.5 },
  ],
  durationCount: 1,
  durationUnit: 'weeks',
  foodRelation: '',
  instructions: '',
};

describe('calculateFixedScheduleDispenseQuantity', () => {
  it('sums scheduled counts and rounds up once for the course', () => {
    expect(calculateFixedScheduleDispenseQuantity(row)).toEqual({ count: 11, unit: 'tab' });
    expect(calculateFixedScheduleDispenseQuantity({ ...row, form: 'capsule', unitLabel: 'cap' }))
      .toEqual({ count: 11, unit: 'cap' });
  });

  it.each<Partial<PrescribingRow>>([
    { unitLabel: 'mg' },
    { unitLabel: '' },
    { durationCount: null },
    { durationUnit: 'months' },
    { durationUnit: 'cont' },
    { doseAmount: null },
    { frequencyCode: 'SOS' },
    { frequencyCode: 'TDS' },
    { taperExpanded: true, taperSteps: [] },
    { taperSteps: [{ id: 'step-1', periodLabel: 'Week 2', frequencyLabel: 'Once daily' }] },
    { parentRowId: 'rx-parent' },
  ])('omits an unresolved quantity for %j', (override) => {
    expect(calculateFixedScheduleDispenseQuantity({ ...row, ...override })).toBeUndefined();
  });
});
