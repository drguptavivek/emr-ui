import type { DoseSlot } from './dose-schedule.models.js';

/** One slot a schedule picker offers: 'Morning', '06:00', 'PRN'. Supplied by the controller, never derived. */
export interface ScheduleSlotDefinition {
  id: string;
  label: string;
  timeHint?: string;
}

/** A one-click selection such as 'BD' -> ['m', 'n']. The picker never infers a preset from the ticked slots' meaning. */
export interface ScheduleSlotPreset {
  id: string;
  label: string;
  slotIds: readonly string[];
}

/** `numeric` edits `DoseSlot.amount`; `label` edits `DoseSlot.amountLabel` ('thin layer'). */
export type ScheduleAmountMode = 'numeric' | 'label';

/** What a newly ticked slot starts with: `{ amount: 1 }` or `{ amount: null, amountLabel: 'thin layer' }`. */
export type ScheduleSlotSeed = Pick<DoseSlot, 'amount' | 'amountLabel'>;

const slotFrom = (definition: ScheduleSlotDefinition, amounts: ScheduleSlotSeed): DoseSlot => ({
  ...amounts,
  id: definition.id,
  label: definition.label,
  ...(definition.timeHint ? { timeHint: definition.timeHint } : {}),
});

/**
 * Rebuilds the value in `slots` order. `pick` returns the amounts for a slot that should be ticked, or
 * `undefined` to leave it out. Ids in `value` that are not in `slots` are dropped.
 */
const rebuildScheduleSlots = (
  slots: readonly ScheduleSlotDefinition[],
  pick: (definition: ScheduleSlotDefinition, current: DoseSlot | undefined) => ScheduleSlotSeed | undefined,
  value: readonly DoseSlot[] | null,
): DoseSlot[] => {
  const current = new Map((value ?? []).map((slot) => [slot.id, slot]));
  return slots.flatMap((definition) => {
    const amounts = pick(definition, current.get(definition.id));
    return amounts ? [slotFrom(definition, amounts)] : [];
  });
};

/** Ticks (`checked`) or unticks one slot. A slot that was already ticked keeps its amount. */
export const toggleSlot = (
  value: readonly DoseSlot[] | null,
  slots: readonly ScheduleSlotDefinition[],
  slotId: string,
  checked: boolean,
  seed: ScheduleSlotSeed,
): DoseSlot[] =>
  rebuildScheduleSlots(
    slots,
    (definition, current) => {
      if (definition.id !== slotId) return current;
      if (!checked) return undefined;
      return current ?? seed;
    },
    value,
  );

/** Sets the amount of one ticked slot. An unticked slot stays unticked. */
export const setSlotAmount = (
  value: readonly DoseSlot[] | null,
  slots: readonly ScheduleSlotDefinition[],
  slotId: string,
  amounts: ScheduleSlotSeed,
): DoseSlot[] =>
  rebuildScheduleSlots(
    slots,
    (definition, current) => (current && definition.id === slotId ? { ...current, ...amounts } : current),
    value,
  );

/**
 * Replaces the selection with the preset's slots. Slots already ticked keep their amount; newly ticked
 * ones get `seed`. Preset ids missing from `slots` are ignored.
 */
export const applySlotPreset = (
  value: readonly DoseSlot[] | null,
  slots: readonly ScheduleSlotDefinition[],
  preset: ScheduleSlotPreset,
  seed: ScheduleSlotSeed,
): DoseSlot[] =>
  rebuildScheduleSlots(
    slots,
    (definition, current) => (preset.slotIds.includes(definition.id) ? (current ?? seed) : undefined),
    value,
  );

/** Mechanical set equality, used only for `aria-pressed`; it says nothing about clinical frequency. */
export const isPresetActive = (value: readonly DoseSlot[] | null, preset: ScheduleSlotPreset): boolean => {
  const ticked = new Set((value ?? []).map((slot) => slot.id));
  const target = new Set(preset.slotIds);
  return ticked.size === target.size && preset.slotIds.every((id) => ticked.has(id));
};

/** Formats a ticked slot's read-only readout without pluralising or deriving frequency. */
export const formatSlotReadout = (
  slot: DoseSlot,
  unitLabel?: string,
  noAmountLabel = 'Selected, no amount',
): string => {
  if (slot.amountLabel) return slot.amountLabel;
  if (slot.amount === null) return noAmountLabel;
  return unitLabel ? `${slot.amount} ${unitLabel}` : String(slot.amount);
};
