import type {
  DoseSlot,
  EmrCodedValue,
  EmrPartialDate,
  EmrSignatureStroke,
  ScheduleSlotDefinition,
  ScheduleSlotPreset,
  ScheduleSlotSeed,
} from '@drguptavivek/emr-controller';

export interface CodedChip {
  readonly concept: EmrCodedValue;
  readonly key: string;
  readonly system: string;
}

export const codedConceptKey = (c: EmrCodedValue): string => `${c.system}|${c.code}`;

/** Normalises a single concept, concept array, or null into display chips with resolved system names. */
export const codedInputChips = (
  value: EmrCodedValue | readonly EmrCodedValue[] | null,
  systemLabels?: Readonly<Record<string, string>>,
): CodedChip[] => {
  const list =
    value === null ? [] : Array.isArray(value) ? (value as readonly EmrCodedValue[]) : [value as EmrCodedValue];
  return list.map(concept => ({
    concept,
    key: codedConceptKey(concept),
    system: systemLabels?.[concept.system] ?? concept.system,
  }));
};

// Spreads `amounts` first so an existing slot keeps controller-added fields such as `householdLabel`.
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
const rebuild = (
  slots: readonly ScheduleSlotDefinition[],
  pick: (definition: ScheduleSlotDefinition, current: DoseSlot | undefined) => ScheduleSlotSeed | undefined,
  value: readonly DoseSlot[] | null,
): DoseSlot[] => {
  const current = new Map((value ?? []).map(slot => [slot.id, slot]));
  return slots.flatMap(definition => {
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
  rebuild(
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
  rebuild(
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
  rebuild(slots, (definition, current) => (preset.slotIds.includes(definition.id) ? current ?? seed : undefined), value);

/** Mechanical set equality, used only for `aria-pressed`; it says nothing about clinical frequency. */
export const isPresetActive = (
  value: readonly DoseSlot[] | null,
  preset: ScheduleSlotPreset,
): boolean => {
  const ticked = new Set((value ?? []).map(slot => slot.id));
  return ticked.size === new Set(preset.slotIds).size && preset.slotIds.every(id => ticked.has(id));
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

// ---------------------------------------------------------------------------
// Pure helpers for L2 contract & specialty fields
// ---------------------------------------------------------------------------

/**
 * Detects a trailing SmartPhrase / macro token starting with `.` or `/` at the end of `text`
 * when preceded by start-of-input or whitespace (e.g. `"Fundus: .mac"` -> `".mac"`).
 * Never matches decimals (`"12.5"`) or dates (`"12/05"`).
 */
export function extractTrailingMacroToken(text: string): string | null {
  if (!text) return null;
  const match = /(?:^|\s)([./][A-Za-z][A-Za-z0-9_-]*|[./])$/.exec(text);
  return match ? match[1]! : null;
}

/** Formats attachment byte size mechanically (`"512 B"`, `"14.2 KB"`, `"2.4 MB"`). */
export function formatByteSize(sizeBytes: number | undefined): string {
  if (sizeBytes === undefined || !Number.isFinite(sizeBytes) || sizeBytes < 0) return '';
  if (sizeBytes < 1024) return `${Math.round(sizeBytes)} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Converts `ScaleFieldViewModel['anchors']` into L1 `EmrScaleAnchor` entries. */
export function buildScaleAnchors(
  min: number,
  max: number,
  anchors?: { readonly minLabel?: string; readonly midLabel?: string; readonly maxLabel?: string },
): { value: number; label: string }[] {
  if (!anchors) return [];
  const result: { value: number; label: string }[] = [];
  if (anchors.minLabel) result.push({ value: min, label: anchors.minLabel });
  if (anchors.midLabel) result.push({ value: (min + max) / 2, label: anchors.midLabel });
  if (anchors.maxLabel) result.push({ value: max, label: anchors.maxLabel });
  return result;
}

/** Adapts an existing ISO partial date string when switching precision (`year` | `month` | `day`). */
export function adaptPartialDatePrecision(
  current: EmrPartialDate | null,
  nextPrecision: EmrPartialDate['precision'],
): EmrPartialDate | null {
  if (!current || !current.value) return null;
  const parts = current.value.split('-');
  const y = parts[0];
  if (!y || !/^\d{4}$/.test(y)) return null;
  if (nextPrecision === 'year') {
    return { value: y, precision: 'year' };
  }
  const m = parts[1] && /^\d{2}$/.test(parts[1]) ? parts[1] : '01';
  if (nextPrecision === 'month') {
    return { value: `${y}-${m}`, precision: 'month' };
  }
  const d = parts[2] && /^\d{2}$/.test(parts[2]) ? parts[2] : '01';
  return { value: `${y}-${m}-${d}`, precision: 'day' };
}

/** Formats SVG polyline points string `"x1,y1 x2,y2 ..."` for web signature rendering. */
export function signaturePolylinePoints(stroke: EmrSignatureStroke): string {
  return stroke.points.map(p => `${Number(p.x.toFixed(1))},${Number(p.y.toFixed(1))}`).join(' ');
}

export interface SignatureSegmentGeometry {
  readonly key: string;
  readonly cx: number;
  readonly cy: number;
  readonly length: number;
  readonly angleDeg: number;
}

/**
 * Computes line-segment center, length, and rotation angle in degrees for native View-based
 * signature rendering (zero external native dependencies).
 */
export function computeSignatureSegments(
  stroke: EmrSignatureStroke,
  strokeIndex = 0,
): readonly SignatureSegmentGeometry[] {
  const pts = stroke.points;
  if (pts.length < 2) return [];
  const segments: SignatureSegmentGeometry[] = [];
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]!;
    const curr = pts[i]!;
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const length = Math.hypot(dx, dy);
    if (length < 0.25) continue;
    segments.push({
      key: `${strokeIndex}-${i}`,
      cx: (prev.x + curr.x) / 2,
      cy: (prev.y + curr.y) / 2,
      length,
      angleDeg: (Math.atan2(dy, dx) * 180) / Math.PI,
    });
  }
  return segments;
}
