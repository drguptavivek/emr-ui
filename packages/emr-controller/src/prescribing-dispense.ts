import type { PrescribingDispenseQuantity, PrescribingRow } from './dose-schedule.models.js';

const dailyDoseCounts: Readonly<Record<string, number>> = { OD: 1, HS: 1, BD: 2, TDS: 3, QID: 4 };

/** Calculates a whole-unit quantity for a single, fixed daily tablet or capsule regimen. */
export function calculateFixedScheduleDispenseQuantity(
  row: PrescribingRow,
): PrescribingDispenseQuantity | undefined {
  const unit = row.form === 'tablet' ? 'tab' : row.form === 'capsule' ? 'cap' : undefined;
  if (!unit || row.unitLabel !== unit || !row.drugName.trim() || row.doseAmount === null) return undefined;
  if (row.taperExpanded || row.taperSteps?.length || row.parentRowId || row.stepPhase) return undefined;

  // Calendar months and open-ended durations need an explicitly resolved number of days.
  const daysPerUnit = row.durationUnit === 'days' ? 1 : row.durationUnit === 'weeks' ? 7 : undefined;
  if (!daysPerUnit || row.durationCount === null || row.durationCount <= 0) return undefined;
  const days = row.durationCount * daysPerUnit;
  if (!Number.isSafeInteger(days)) return undefined;

  const frequency = row.frequencyCode?.trim().toUpperCase() ?? '';
  const customFrequency = /^(\d+)X\/D$/.exec(frequency);
  const expectedDoses = customFrequency ? Number(customFrequency[1]) : dailyDoseCounts[frequency];

  let doses = 0;
  let dailyQuantity = 0;
  const seenSlots = new Set<string>();
  for (const slot of row.slots) {
    const amount = slot.amount ?? 0;
    if (slot.amountLabel || seenSlots.has(slot.id) || !Number.isFinite(amount) || amount < 0) return undefined;
    seenSlots.add(slot.id);
    if (amount > 0) doses++;
    dailyQuantity += amount;
  }
  if (!doses || doses !== expectedDoses) return undefined;

  const count = Math.ceil(dailyQuantity * days);
  return Number.isSafeInteger(count) ? { count, unit } : undefined;
}
