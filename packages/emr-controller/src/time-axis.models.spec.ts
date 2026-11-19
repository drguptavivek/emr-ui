import { describe, expect, it } from 'vitest';
import {
  canChangeTimeAxisStep,
  canPanTimeAxis,
  canSelectTimeAxisSlot,
  canTriggerTimeAxisIntent,
  resolveTimeAxisHeadingId,
  resolveTimeAxisId,
  resolveTimeAxisNextIndex,
  resolveTimeAxisTabStopId,
  resolveTimeAxisTickId,
  type EmrTimeAxisLabels,
  type TimeAxisViewModel,
} from './time-axis.models.js';

describe('time-axis models and helpers', () => {
  const baseModel: TimeAxisViewModel = {
    id: 'icu-axis',
    title: 'ICU chart, hourly',
    ticks: [
      { id: 't08', label: '08:00', sublabel: 'Day 1' },
      { id: 't09', label: '09:00', sublabel: 'Day 1', current: true },
      { id: 't10', label: '10:00', sublabel: 'Day 1' },
    ],
    selectedTickId: 't08',
    steps: [
      { id: '60', label: 'Hourly' },
      { id: '30', label: '30 min' },
    ],
    selectedStepId: '60',
    canShiftEarlier: true,
    canShiftLater: false,
  };

  it('enforces slot selection, step change, and pan capability guards including readOnly', () => {
    expect(canSelectTimeAxisSlot(baseModel, 't09')).toBe(true);
    expect(canSelectTimeAxisSlot(baseModel, 'missing')).toBe(false);
    expect(canChangeTimeAxisStep(baseModel, '30')).toBe(true);
    expect(canChangeTimeAxisStep(baseModel, '15')).toBe(false);
    expect(canChangeTimeAxisStep({ ...baseModel, steps: undefined }, '60')).toBe(false);
    expect(canPanTimeAxis(baseModel, 'earlier')).toBe(true);
    expect(canPanTimeAxis(baseModel, 'later')).toBe(false);

    const readOnlyModel: TimeAxisViewModel = { ...baseModel, readOnly: true, canShiftLater: true };
    expect(canSelectTimeAxisSlot(readOnlyModel, 't09')).toBe(false);
    expect(canChangeTimeAxisStep(readOnlyModel, '30')).toBe(false);
    expect(canPanTimeAxis(readOnlyModel, 'earlier')).toBe(false);
    expect(canPanTimeAxis(readOnlyModel, 'later')).toBe(false);

    expect(canTriggerTimeAxisIntent(baseModel, { type: 'tickSelected', tickId: 't09' })).toBe(true);
    expect(canTriggerTimeAxisIntent(baseModel, { type: 'stepChangeRequested', stepId: '30' })).toBe(true);
    expect(canTriggerTimeAxisIntent(baseModel, { type: 'shiftEarlierRequested' })).toBe(true);
    expect(canTriggerTimeAxisIntent(baseModel, { type: 'shiftLaterRequested' })).toBe(false);
    expect(canTriggerTimeAxisIntent(readOnlyModel, { type: 'tickSelected', tickId: 't09' })).toBe(false);
  });

  it('resolves deterministic axis, heading, and tick ids with idPrefix trimming', () => {
    expect(resolveTimeAxisId('icu-axis')).toBe('emr-time-axis-icu-axis');
    expect(resolveTimeAxisId('icu-axis', '  ward-a- ')).toBe('ward-a-emr-time-axis-icu-axis');
    expect(resolveTimeAxisId('  ')).toBe('emr-time-axis-time-axis');

    expect(resolveTimeAxisHeadingId('icu-axis')).toBe('emr-time-axis-icu-axis-heading');
    expect(resolveTimeAxisHeadingId('icu-axis', 'ward-a')).toBe('ward-a-emr-time-axis-icu-axis-heading');
    expect(resolveTimeAxisHeadingId('icu-axis', 'ward-a', 'custom-axis-heading')).toBe('custom-axis-heading');

    expect(resolveTimeAxisTickId('icu-axis', 't09', 'ward-a-')).toBe('ward-a-emr-time-axis-icu-axis-tick-t09');
  });

  it('resolves roving tab stop and horizontal keyboard navigation index', () => {
    expect(resolveTimeAxisTabStopId(baseModel.ticks, 't10', 't08')).toBe('t10');
    expect(resolveTimeAxisTabStopId(baseModel.ticks, 'stale', 't08')).toBe('t08');
    expect(resolveTimeAxisTabStopId(baseModel.ticks, null, 'stale')).toBe('t09');
    expect(resolveTimeAxisTabStopId([{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], null, null)).toBe('a');
    expect(resolveTimeAxisTabStopId([], null, null)).toBeUndefined();

    expect(resolveTimeAxisNextIndex('ArrowRight', 0, 3)).toBe(1);
    expect(resolveTimeAxisNextIndex('ArrowRight', 2, 3)).toBe(2);
    expect(resolveTimeAxisNextIndex('ArrowLeft', 1, 3)).toBe(0);
    expect(resolveTimeAxisNextIndex('ArrowLeft', 0, 3)).toBe(0);
    expect(resolveTimeAxisNextIndex('Home', 2, 3)).toBe(0);
    expect(resolveTimeAxisNextIndex('End', 0, 3)).toBe(2);
    expect(resolveTimeAxisNextIndex('ArrowDown', 0, 3)).toBeNull();
    expect(resolveTimeAxisNextIndex('ArrowUp', 1, 3)).toBeNull();
    expect(resolveTimeAxisNextIndex('ArrowRight', 0, 0)).toBeNull();
  });

  it('supports typed EmrTimeAxisLabels overrides', () => {
    const labels: EmrTimeAxisLabels = {
      title: 'Round times',
      empty: 'No rounds.',
      step: 'Interval',
      stepValue: (label) => `Interval: ${label}`,
      earlier: 'Back',
      later: 'Forward',
      current: 'Now',
      selected: 'chosen',
    };
    expect(labels.stepValue?.('Hourly')).toBe('Interval: Hourly');
  });
});
