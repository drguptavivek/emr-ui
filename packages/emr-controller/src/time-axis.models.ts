/** One point on the time axis (an hour, a quarter hour, a shift). Every label is controller-supplied. */
export interface TimeAxisTick {
  readonly id: string;
  readonly label: string;
  readonly sublabel?: string;
  /** The tick for "now"; the component marks it with text as well as styling. */
  readonly current?: boolean;
}

/** A step the controller offers, e.g. { id: '60', label: 'Hourly' }. */
export interface TimeAxisStep {
  readonly id: string;
  readonly label: string;
}

/**
 * A horizontal time scale that a flowsheet or trend can sit under. The component never
 * computes times: the controller supplies the visible ticks and moves the window on intent.
 */
export interface TimeAxisViewModel {
  readonly id: string;
  readonly title?: string;
  readonly ticks: readonly TimeAxisTick[];
  readonly selectedTickId?: string;
  /** Current step as words ('Hourly', '15 min'). Shown as text when no `steps` are offered. */
  readonly stepLabel?: string;
  /** Steps to choose from; when present a step chooser emits `stepChangeRequested`. */
  readonly steps?: readonly TimeAxisStep[];
  readonly selectedStepId?: string;
  readonly canShiftEarlier?: boolean;
  readonly canShiftLater?: boolean;
  /** No selection, no shifting, no step chooser. */
  readonly readOnly?: boolean;
}

export type TimeAxisIntent =
  | { readonly type: 'tickSelected'; readonly tickId: string }
  | { readonly type: 'shiftEarlierRequested' }
  | { readonly type: 'shiftLaterRequested' }
  | { readonly type: 'stepChangeRequested'; readonly stepId: string };

export interface EmrTimeAxisLabels {
  readonly title?: string;
  readonly empty?: string;
  readonly step?: string;
  readonly stepValue?: (label: string) => string;
  readonly earlier?: string;
  readonly later?: string;
  readonly current?: string;
  readonly selected?: string;
}

export function canSelectTimeAxisSlot(
  model: Pick<TimeAxisViewModel, 'readOnly' | 'ticks'>,
  tickId: string,
): boolean {
  if (model.readOnly) return false;
  return model.ticks.some((tick) => tick.id === tickId);
}

export function canChangeTimeAxisStep(
  model: Pick<TimeAxisViewModel, 'readOnly' | 'steps'>,
  stepId: string,
): boolean {
  if (model.readOnly || !model.steps?.length) return false;
  return model.steps.some((step) => step.id === stepId);
}

export function canPanTimeAxis(
  model: Pick<TimeAxisViewModel, 'readOnly' | 'canShiftEarlier' | 'canShiftLater'>,
  direction: 'earlier' | 'later',
): boolean {
  if (model.readOnly) return false;
  return direction === 'earlier' ? Boolean(model.canShiftEarlier) : Boolean(model.canShiftLater);
}

export function canTriggerTimeAxisIntent(
  model: TimeAxisViewModel,
  intent: TimeAxisIntent,
): boolean {
  switch (intent.type) {
    case 'tickSelected':
      return canSelectTimeAxisSlot(model, intent.tickId);
    case 'stepChangeRequested':
      return canChangeTimeAxisStep(model, intent.stepId);
    case 'shiftEarlierRequested':
      return canPanTimeAxis(model, 'earlier');
    case 'shiftLaterRequested':
      return canPanTimeAxis(model, 'later');
  }
}

export function resolveTimeAxisId(axisId: string, idPrefix = ''): string {
  const prefix = idPrefix.trim().replace(/-+$/, '');
  const cleanId = axisId.trim() || 'time-axis';
  return prefix ? `${prefix}-emr-time-axis-${cleanId}` : `emr-time-axis-${cleanId}`;
}

export function resolveTimeAxisHeadingId(
  axisId: string,
  idPrefix = '',
  headingId?: string | null,
): string {
  const explicit = headingId?.trim();
  if (explicit) return explicit;
  return `${resolveTimeAxisId(axisId, idPrefix)}-heading`;
}

export function resolveTimeAxisTickId(
  axisId: string,
  tickId: string,
  idPrefix = '',
): string {
  return `${resolveTimeAxisId(axisId, idPrefix)}-tick-${tickId}`;
}

export function resolveTimeAxisTabStopId(
  ticks: readonly Pick<TimeAxisTick, 'id' | 'current'>[],
  focusedId?: string | null,
  selectedTickId?: string | null,
): string | undefined {
  const has = (id: string | null | undefined): id is string =>
    Boolean(id && ticks.some((tick) => tick.id === id));
  if (has(focusedId)) return focusedId;
  if (has(selectedTickId)) return selectedTickId;
  return ticks.find((tick) => tick.current)?.id ?? ticks[0]?.id;
}

export function resolveTimeAxisNextIndex(
  key: string,
  currentIndex: number,
  count: number,
): number | null {
  if (count <= 0) return null;
  const clamped = currentIndex >= 0 && currentIndex < count ? currentIndex : 0;
  switch (key) {
    case 'ArrowRight':
      return Math.min(clamped + 1, count - 1);
    case 'ArrowLeft':
      return Math.max(clamped - 1, 0);
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}
